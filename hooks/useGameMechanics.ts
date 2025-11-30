import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { ClaimService } from '@/services/claim.service';
import { POI } from '@/types';
import { ENTRY_DURATION, MINUTE_BONUS } from '@/constants/config';

interface UseGameMechanicsProps {
  isInsideRadius: boolean;
  activePOI: POI | null;
  userId?: string;
}

export function useGameMechanics({ isInsideRadius, activePOI, userId }: UseGameMechanicsProps) {
  // Entry mode state (10-second yellow arc animation)
  const [entryProgress, setEntryProgress] = useState(0);
  const entryAnimationRef = useRef<number | null>(null);

  // Capture mode state
  const [isCaptureActive, setIsCaptureActive] = useState(false);
  const [captureSeconds, setCaptureSeconds] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [dailySecondsForActivePOI, setDailySecondsForActivePOI] = useState(0);

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
      
      const duration = ENTRY_DURATION * 1000;
      const startTime = Date.now();
      
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
      
      if (entryAnimationRef.current) {
        cancelAnimationFrame(entryAnimationRef.current);
        entryAnimationRef.current = null;
      }
      
      setEntryProgress(0);
      setIsCaptureActive(false);
    }
    
    return () => {
      if (entryAnimationRef.current) {
        cancelAnimationFrame(entryAnimationRef.current);
      }
    };
  }, [isInsideRadius, isCaptureActive, entryProgress, activePOI, userId]);

  // ========================================
  // PHASE 2: CAPTURE MODE (up to 60 seconds)
  // Timer that counts seconds and awards bonuses
  // ========================================
  useEffect(() => {
    if (isCaptureActive && !captureIntervalRef.current) {
      
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
          
          // Check for minute bonus (every 60 seconds)
          let bonusSeconds = 0;
          if (newSeconds % 60 === 0 && newSeconds > 0) {
            bonusSeconds = MINUTE_BONUS;
            console.log('🎉 MINUTE BONUS! +10 seconds');
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
              
              // Trigger save via callback (handled in parent component)
            }
            
            return newSessionSeconds;
          });
          
          return newSeconds;
        });
      }, 1000);
    }
    
    // Cleanup on unmount or when leaving radius during capture
    if (!isInsideRadius && isCaptureActive) {
      console.log('❌ Left radius during CAPTURE mode');
      
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
  }, [isCaptureActive, isInsideRadius, dailySecondsForActivePOI]);

  // Reset states when active POI changes
  useEffect(() => {
    setEntryProgress(0);
    setIsCaptureActive(false);
    setCaptureSeconds(0);
    setSessionSeconds(0);
    setDailySecondsForActivePOI(0);
    captureStartTimeRef.current = null;
    
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (entryAnimationRef.current) {
      cancelAnimationFrame(entryAnimationRef.current);
      entryAnimationRef.current = null;
    }
  }, [activePOI?.id]);

  return {
    // Entry mode
    entryProgress,
    
    // Capture mode
    isCaptureActive,
    captureSeconds,
    sessionSeconds,
    dailySecondsForActivePOI,
    captureStartTime: captureStartTimeRef.current,
    
    // Manual controls
    resetCapture: () => {
      setIsCaptureActive(false);
      setCaptureSeconds(0);
      setSessionSeconds(0);
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    },
  };
}

