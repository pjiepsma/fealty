import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { ClaimService } from '@/services/claim.service';
import { POI } from '@/types';
import { CLAIM_CONSTANTS, REWARD_SYSTEM } from '@/constants/config';

const { ENTRY_DURATION, KING_ENTRY_DURATION } = CLAIM_CONSTANTS;
const { MINUTE_BONUS_SECONDS } = REWARD_SYSTEM;

interface UseGameMechanicsProps {
  isInsideRadius: boolean;
  activePOI: POI | null;
  userId?: string;
  onSaveClaim: (secondsEarned: number) => void;
}

export function useGameMechanics({ isInsideRadius, activePOI, userId, onSaveClaim }: UseGameMechanicsProps) {
  // Entry mode state (yellow arc animation)
  const [entryProgress, setEntryProgress] = useState(0);
  const entryAnimationRef = useRef<number | null>(null);
  const [isKing, setIsKing] = useState(false);
  const [entryDuration, setEntryDuration] = useState(ENTRY_DURATION);

  // Capture mode state
  const [isCaptureActive, setIsCaptureActive] = useState(false);
  const [captureSeconds, setCaptureSeconds] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [dailySecondsForActivePOI, setDailySecondsForActivePOI] = useState(0);
  const [totalCapturedSeconds, setTotalCapturedSeconds] = useState(0);

  // Refs
  const captureStartTimeRef = useRef<Date | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ========================================
  // PHASE 1: ENTRY MODE (60 seconds normal, 25 seconds for king)
  // Yellow arc animation when entering radius
  // ========================================
  useEffect(() => {
    // Check if user is king when entering radius, then start entry animation
    if (isInsideRadius && !isCaptureActive && entryProgress === 0 && !entryAnimationRef.current && activePOI && userId) {
      // First check if user is king
      ClaimService.isUserKingOfPOI(userId, activePOI.id).then((kingStatus) => {
        setIsKing(kingStatus);
        const duration = kingStatus ? KING_ENTRY_DURATION : ENTRY_DURATION;
        setEntryDuration(duration);
        
        if (kingStatus) {
          console.log('👑 The land recognizes its ruler... Entry timer reduced to 25s');
        }
        
        // Now start the entry animation with the correct duration
        const durationText = kingStatus ? `${KING_ENTRY_DURATION} seconds (King)` : `${ENTRY_DURATION} seconds`;
        console.log(`🚪 ENTRY MODE started (${durationText})...`);
        
        const startTime = Date.now();
        const durationMs = duration * 1000;
      
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / durationMs, 1);
          setEntryProgress(progress);
          
          if (progress < 1) {
            entryAnimationRef.current = requestAnimationFrame(animate);
          } else {
            // Entry complete → fetch daily seconds then start capture mode
            console.log('✅ ENTRY complete → Starting CAPTURE mode');
            setEntryProgress(1);
            entryAnimationRef.current = null;
            
            // Fetch how many seconds user already claimed today at this POI
            if (userId && activePOI) {
              ClaimService.getDailySecondsForPOI(userId, activePOI.id).then((seconds) => {
                console.log(`📊 Already claimed ${seconds}s today at this POI`);
                setDailySecondsForActivePOI(seconds);
                
                if (seconds >= 60) {
                  console.log('⚠️ Daily limit reached (60s) - cannot capture more');
                  
                  // Show alert to user
                  Alert.alert(
                    '✅ Daily Limit Reached',
                    `You've already claimed 60 seconds at ${activePOI.name} today.\n\nCome back tomorrow to earn more!`,
                    [{ text: 'OK' }]
                  );
                  
                  // Don't start capture mode
                } else {
                  setIsCaptureActive(true);
                  console.log(`🎯 You have ${60 - seconds}s remaining today`);
                }
              });
            } else {
              setIsCaptureActive(true);
            }
          }
        };
        
        entryAnimationRef.current = requestAnimationFrame(animate);
      });
    } else if (!isInsideRadius) {
      // User left radius → reset everything
      console.log('❌ Left radius → Resetting all modes');
      if (entryAnimationRef.current) {
        cancelAnimationFrame(entryAnimationRef.current);
        entryAnimationRef.current = null;
      }
      setEntryProgress(0);
      setIsCaptureActive(false);
      setIsKing(false);
      setEntryDuration(ENTRY_DURATION);
    }
    
    // Cleanup: cancel animation if component unmounts or dependencies change
    return () => {
      if (entryAnimationRef.current) {
        cancelAnimationFrame(entryAnimationRef.current);
        entryAnimationRef.current = null;
      }
    };
  }, [isInsideRadius, isCaptureActive, activePOI, userId]);
  
  // ========================================
  // PHASE 2: CAPTURE MODE (starts after entry completes)
  // Timer counts from 0:00 to 1:00 (60 seconds max)
  // ========================================
  // Use a ref to track session seconds without causing re-renders
  const sessionSecondsRef = useRef(0);
  
  useEffect(() => {
    if (isCaptureActive && !captureIntervalRef.current) {
      console.log('🎯 CAPTURE MODE started');
      
      // Record capture start time
      captureStartTimeRef.current = new Date();
      
      // Reset session seconds ref
      sessionSecondsRef.current = 0;
      
      // Start timer from daily seconds already claimed
      setCaptureSeconds(dailySecondsForActivePOI);
      setSessionSeconds(0); // Reset session seconds (new seconds in THIS session)
      
      console.log(`🎯 CAPTURE MODE started (continuing from ${dailySecondsForActivePOI}s)`);
      
      // Start capture timer (updates every second)
      captureIntervalRef.current = setInterval(() => {
        setCaptureSeconds((prev) => {
          const newSeconds = prev + 1;
          
          // Add 1 second to session
          let bonusSeconds = 0;
          
          // Check if we just completed a full minute
          if (newSeconds % 60 === 0) {
            bonusSeconds = MINUTE_BONUS_SECONDS;
            console.log(`🎉 MINUTE BONUS! +${MINUTE_BONUS_SECONDS} seconds`);
          }
          
          // Update session seconds (real time + bonuses)
          setSessionSeconds((prevSeconds) => {
            const newSessionSeconds = prevSeconds + 1 + bonusSeconds;
            // Update ref with latest value
            sessionSecondsRef.current = newSessionSeconds;
            
            if (bonusSeconds > 0) {
              console.log(`⏱️ Session: ${newSeconds}s captured = ${newSessionSeconds}s earned (${Math.floor(newSeconds / 60)} minute bonus)`);
            }
            
            // Stop at 60 seconds (1 minute)
            if (newSeconds >= 60) {
              if (captureIntervalRef.current) {
                clearInterval(captureIntervalRef.current);
                captureIntervalRef.current = null;
              }
              console.log('✅ CAPTURE complete at 1:00');
              
              // Save claim to database with the calculated session seconds
              onSaveClaim(newSessionSeconds);
              
              // Reset capture start time
              captureStartTimeRef.current = null;
            }
            
            return newSessionSeconds;
          });
          
          return newSeconds;
        });
      }, 1000);
    } else if (!isCaptureActive && captureIntervalRef.current) {
      // Stop capture and save seconds
      console.log('⏹️ CAPTURE MODE stopped');
      
      // Use ref value to avoid dependency on sessionSeconds state
      const finalSessionSeconds = sessionSecondsRef.current;
      
      // Save session seconds to total
      if (finalSessionSeconds > 0) {
        setTotalCapturedSeconds((prev) => {
          const newTotal = prev + finalSessionSeconds;
          console.log(`💾 Saved ${finalSessionSeconds}s this session. Total: ${newTotal}s`);
          return newTotal;
        });
      }
      
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
      setCaptureSeconds(0);
      setSessionSeconds(0);
      setDailySecondsForActivePOI(0);
      sessionSecondsRef.current = 0;
    }
    
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    };
  }, [isCaptureActive, dailySecondsForActivePOI, onSaveClaim]); // Removed sessionSeconds from dependencies

  // Handle leaving radius during capture
  useEffect(() => {
    if (!isInsideRadius && isCaptureActive) {
      console.log('❌ Left radius during CAPTURE mode');
      
      // Use ref value to avoid dependency on sessionSeconds state
      const currentSessionSeconds = sessionSecondsRef.current;
      
      // Save claim to database
      if (currentSessionSeconds > 0) {
        onSaveClaim(currentSessionSeconds);
        
        setTotalCapturedSeconds((prev) => {
          const newTotal = prev + currentSessionSeconds;
          console.log(`💾 Session ended: +${currentSessionSeconds}s`);
          console.log(`⏱️ Total captured: ${newTotal}s`);
          return newTotal;
        });
      }
      
      setIsCaptureActive(false);
    }
  }, [isInsideRadius, isCaptureActive, onSaveClaim]); // Removed sessionSeconds from dependencies

  return {
    // Entry mode
    entryProgress,
    isKing,
    entryDuration,
    
    // Capture mode
    isCaptureActive,
    captureSeconds,
    sessionSeconds,
    totalCapturedSeconds,
    captureStartTime: captureStartTimeRef.current,
  };
}
