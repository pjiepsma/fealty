import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { ClaimService } from '@/services/claim.service';
import { POI } from '@/types';
import { CLAIM_CONSTANTS, REWARD_SYSTEM } from '@/constants/config';

const { ENTRY_DURATION } = CLAIM_CONSTANTS;
const { MINUTE_BONUS_SECONDS } = REWARD_SYSTEM;

interface UseGameMechanicsProps {
  isInsideRadius: boolean;
  activePOI: POI | null;
  userId?: string;
  onSaveClaim: (secondsEarned: number) => void;
}

export function useGameMechanics({ isInsideRadius, activePOI, userId, onSaveClaim }: UseGameMechanicsProps) {
  // Entry mode state (10-second yellow arc animation)
  const [entryProgress, setEntryProgress] = useState(0);
  const entryAnimationRef = useRef<number | null>(null);

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
  // PHASE 1: ENTRY MODE (10 seconds)
  // Yellow arc animation when entering radius
  // ========================================
  useEffect(() => {
    if (isInsideRadius && !isCaptureActive && entryProgress === 0) {
      console.log('🚪 ENTRY MODE started (10 seconds)...');
      
      const startTime = Date.now();
      const duration = ENTRY_DURATION * 1000; // 10 seconds
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setEntryProgress(progress);
        
        if (progress < 1) {
          entryAnimationRef.current = requestAnimationFrame(animate);
        } else {
          // Entry complete → fetch daily seconds then start capture mode
          console.log('✅ ENTRY complete → Starting CAPTURE mode');
          setEntryProgress(1);
          
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
          
          entryAnimationRef.current = null;
        }
      };
      
      entryAnimationRef.current = requestAnimationFrame(animate);
    } else if (!isInsideRadius) {
      // User left radius → reset everything
      console.log('❌ Left radius → Resetting all modes');
      setEntryProgress(0);
      setIsCaptureActive(false);
      if (entryAnimationRef.current) {
        cancelAnimationFrame(entryAnimationRef.current);
        entryAnimationRef.current = null;
      }
    }
    
    // NO cleanup function - let animation run to completion
  }, [isInsideRadius, isCaptureActive, entryProgress, activePOI, userId]);
  
  // ========================================
  // PHASE 2: CAPTURE MODE (starts after entry completes)
  // Timer counts from 0:00 to 1:00 (60 seconds max)
  // ========================================
  useEffect(() => {
    if (isCaptureActive && !captureIntervalRef.current) {
      console.log('🎯 CAPTURE MODE started');
      
      // Record capture start time
      captureStartTimeRef.current = new Date();
      
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
      
      // Save session seconds to total
      if (sessionSeconds > 0) {
        setTotalCapturedSeconds((prev) => {
          const newTotal = prev + sessionSeconds;
          console.log(`💾 Saved ${sessionSeconds}s this session. Total: ${newTotal}s`);
          return newTotal;
        });
      }
      
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
      setCaptureSeconds(0);
      setSessionSeconds(0);
      setDailySecondsForActivePOI(0);
    }
    
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    };
  }, [isCaptureActive, dailySecondsForActivePOI, sessionSeconds, onSaveClaim]);

  // Handle leaving radius during capture
  useEffect(() => {
    if (!isInsideRadius && isCaptureActive) {
      console.log('❌ Left radius during CAPTURE mode');
      
      // Save claim to database
      if (sessionSeconds > 0) {
        onSaveClaim(sessionSeconds);
        
        setTotalCapturedSeconds((prev) => {
          const newTotal = prev + sessionSeconds;
          console.log(`💾 Session ended: +${sessionSeconds}s`);
          console.log(`⏱️ Total captured: ${newTotal}s`);
          return newTotal;
        });
      }
      
      setIsCaptureActive(false);
    }
  }, [isInsideRadius, isCaptureActive, sessionSeconds, onSaveClaim]);

  return {
    // Entry mode
    entryProgress,
    
    // Capture mode
    isCaptureActive,
    captureSeconds,
    sessionSeconds,
    totalCapturedSeconds,
    captureStartTime: captureStartTimeRef.current,
  };
}
