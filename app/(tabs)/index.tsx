import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PoseTransitionSvg from '@/assets/images/poses/pose-transition.svg';

type Pose = {
  id: string;
  name: string;
  duration: number;
  img: ImageSourcePropType;
};

type Routine = {
  id: string;
  name: string;
  description: string;
  poses: Pose[];
};

const MIN_DURATION = 5;
const MIN_TRANSITION = 5;
const DEFAULT_TRANSITION_SECONDS = 10;
const PHASES = {
  POSE: 'POSE',
  TRANSITION: 'TRANSITION',
} as const;

const poseImages = {
  childPose: require('@/assets/images/poses/child-pose.jpg'),
  catCow: require('@/assets/images/poses/cat-cow.jpg'),
  kneesChest: require('@/assets/images/poses/knees-chest.jpg'),
  shoulderRolls: require('@/assets/images/poses/shoulder-rolls.jpg'),
  eagleArms: require('@/assets/images/poses/eagle-arms.jpg'),
  threadNeedle: require('@/assets/images/poses/thread-needle.jpg'),
  neckTilt: require('@/assets/images/poses/neck-tilt.jpg'),
  neckTurn: require('@/assets/images/poses/neck-turn.jpg'),
  chinTuck: require('@/assets/images/poses/chin-tuck.jpg'),
};

const SAMPLE_DATA: Routine[] = [
  {
    id: 'lower-back',
    name: 'Lower Back',
    description: 'Stretches and gentle twists for lower back relief.',
    poses: [
      { id: 'lb-1', name: "Child's Pose", duration: 30, img: poseImages.childPose },
      { id: 'lb-2', name: 'Cat-Cow', duration: 40, img: poseImages.catCow },
      { id: 'lb-3', name: 'Knees-to-Chest', duration: 30, img: poseImages.kneesChest },
    ],
  },
  {
    id: 'shoulder',
    name: 'Shoulder',
    description: 'Open up tight shoulders and upper back.',
    poses: [
      { id: 's-1', name: 'Shoulder Rolls', duration: 20, img: poseImages.shoulderRolls },
      { id: 's-2', name: 'Eagle Arms', duration: 30, img: poseImages.eagleArms },
      { id: 's-3', name: 'Thread the Needle', duration: 40, img: poseImages.threadNeedle },
    ],
  },
  {
    id: 'neck',
    name: 'Neck',
    description: 'Gentle neck stretches to ease tension.',
    poses: [
      { id: 'n-1', name: 'Neck Tilt', duration: 15, img: poseImages.neckTilt },
      { id: 'n-2', name: 'Neck Turn', duration: 15, img: poseImages.neckTurn },
      { id: 'n-3', name: 'Chin Tuck', duration: 20, img: poseImages.chinTuck },
    ],
  },
];

const INITIAL_DURATION = SAMPLE_DATA[0]?.poses[0]?.duration ?? 0;

type Phase = (typeof PHASES)[keyof typeof PHASES];

const BodyPartButton = ({
  label,
  selected,
  poseCount,
  onPress,
}: {
  label: string;
  selected: boolean;
  poseCount: number;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={[styles.partButton, selected && styles.partButtonActive]}
    android_ripple={{ color: '#d4e3ff' }}>
    <Text style={[styles.partButtonLabel, selected && styles.partButtonLabelActive]}>{label}</Text>
    <Text style={[styles.partButtonMeta, selected && styles.partButtonMetaActive]}>
      {poseCount} poses
    </Text>
  </Pressable>
);

const PoseCard = ({
  pose,
  onChangeDuration,
}: {
  pose: Pose;
  onChangeDuration: (delta: number) => void;
}) => (
  <View style={styles.poseCard}>
    <Image source={pose.img} style={styles.poseImage} resizeMode="cover" />
    <View style={styles.poseContent}>
      <Text style={styles.poseTitle}>{pose.name}</Text>
      <Text style={styles.poseSubtitle}>Hold for {pose.duration} sec</Text>
    </View>
    <View style={styles.durationControls}>
      <Pressable
        onPress={() => onChangeDuration(-5)}
        style={[styles.durationButton, styles.durationButtonGhost]}>
        <Text style={styles.durationButtonText}>-5s</Text>
      </Pressable>
      <Pressable
        onPress={() => onChangeDuration(5)}
        style={[styles.durationButton, styles.durationButtonSolid]}>
        <Text style={[styles.durationButtonText, styles.durationButtonSolidText]}>+5s</Text>
      </Pressable>
    </View>
  </View>
);

const RoutinePlayer = ({
  poses,
  currentIndex,
  remaining,
  onPauseResume,
  paused,
  onExit,
  onReset,
  phase,
  transitionSeconds,
}: {
  poses: Pose[];
  currentIndex: number;
  remaining: number;
  onPauseResume: () => void;
  paused: boolean;
  onExit: () => void;
  onReset: () => void;
  phase: Phase;
  transitionSeconds: number;
}) => {
  const currentPose = poses[currentIndex];
  const nextPose = poses[currentIndex + 1];
  const isTransition = phase === PHASES.TRANSITION;
  const displayPose = isTransition ? nextPose ?? currentPose : currentPose;

  const subtitle = isTransition
    ? `Take ${transitionSeconds}s to switch poses`
    : 'Hold this pose';
  const infoLine = isTransition
    ? nextPose
      ? `Up next: ${nextPose.name} — ${nextPose.duration}s`
      : 'Get ready to finish strong.'
    : nextPose
    ? `Next: ${nextPose.name} — ${nextPose.duration}s`
    : 'This is the last pose.';

  const renderPoseVisual = () => {
    if (isTransition) {
      return (
        <View style={styles.transitionArtWrapper}>
          <PoseTransitionSvg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        </View>
      );
    }

    if (displayPose?.img) {
      return <Image source={displayPose.img} style={styles.routineImage} resizeMode="cover" />;
    }

    return null;
  };

  return (
    <View style={styles.routinePlayer}>
      {renderPoseVisual()}
      <Text style={styles.routinePhase}>
        {isTransition ? 'Transition' : displayPose?.name ?? 'Pose'}
      </Text>
      <Text style={styles.routineSubtitle}>{subtitle}</Text>
      <Text style={styles.timerValue}>{remaining}s</Text>
      <Text style={styles.routineSubtitle}>{infoLine}</Text>

      <View style={styles.playerButtons}>
        <Pressable style={styles.secondaryButton} onPress={onPauseResume}>
          <Text style={styles.secondaryButtonLabel}>{paused ? 'Resume' : 'Pause'}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onReset}>
          <Text style={styles.secondaryButtonLabel}>Restart</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={onExit}>
          <Text style={styles.primaryButtonLabel}>Exit</Text>
        </Pressable>
      </View>
    </View>
  );
};

const calculateRoutineTime = (poses: Pose[], transitionSeconds: number) => {
  if (!poses.length) {
    return 0;
  }
  const poseSum = poses.reduce((acc, pose) => acc + pose.duration, 0);
  const transitionSum = Math.max(poses.length - 1, 0) * transitionSeconds;
  return poseSum + transitionSum;
};

export default function HomeScreen() {
  const [routines, setRoutines] = useState<Routine[]>(SAMPLE_DATA);
  const [selectedId, setSelectedId] = useState(SAMPLE_DATA[0]?.id ?? 'lower-back');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState(INITIAL_DURATION);
  const [paused, setPaused] = useState(false);
  const [phase, setPhase] = useState<Phase>(PHASES.POSE);
  const [transitionSeconds, setTransitionSeconds] = useState(DEFAULT_TRANSITION_SECONDS);

  const selectedRoutine = useMemo(
    () => routines.find((routine) => routine.id === selectedId) ?? routines[0],
    [routines, selectedId],
  );

  useEffect(() => {
    if (!isPlaying) {
      setCurrentIndex(0);
      setPhase(PHASES.POSE);
      setPaused(false);
      setRemaining(selectedRoutine?.poses[0]?.duration ?? 0);
    }
  }, [selectedId, selectedRoutine, isPlaying]);

  useEffect(() => {
    if (!isPlaying || paused || !selectedRoutine) {
      return;
    }

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        if (phase === PHASES.POSE) {
          const hasNext = currentIndex + 1 < selectedRoutine.poses.length;

          if (hasNext) {
            setPhase(PHASES.TRANSITION);
            return transitionSeconds;
          }

          setIsPlaying(false);
          return 0;
        }

        if (phase === PHASES.TRANSITION) {
          const nextIndex = currentIndex + 1;

          if (nextIndex < selectedRoutine.poses.length) {
            setCurrentIndex(nextIndex);
            setPhase(PHASES.POSE);
            return selectedRoutine.poses[nextIndex].duration;
          }

          setIsPlaying(false);
          return 0;
        }

        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, paused, currentIndex, phase, selectedRoutine, transitionSeconds]);

  const handleChangeDuration = (poseId: string, delta: number) => {
    let nextFirstPoseDuration: number | null = null;
    setRoutines((prev) => {
      const nextRoutines = prev.map((part) => ({
        ...part,
        poses: part.poses.map((pose) =>
          pose.id === poseId ? { ...pose, duration: Math.max(MIN_DURATION, pose.duration + delta) } : pose,
        ),
      }));
      const updatedSelected = nextRoutines.find((part) => part.id === selectedId);
      nextFirstPoseDuration = updatedSelected?.poses[0]?.duration ?? null;
      return nextRoutines;
    });

    if (!isPlaying && currentIndex === 0 && nextFirstPoseDuration) {
      setRemaining(nextFirstPoseDuration);
    }
  };

  const startRoutine = () => {
    if (!selectedRoutine || !selectedRoutine.poses.length) {
      return;
    }
    setIsPlaying(true);
    setPaused(false);
    setPhase(PHASES.POSE);
    setCurrentIndex(0);
    setRemaining(selectedRoutine.poses[0].duration);
  };

  const exitRoutine = () => {
    setIsPlaying(false);
    setPaused(false);
    setPhase(PHASES.POSE);
    setCurrentIndex(0);
    setRemaining(selectedRoutine?.poses[0]?.duration ?? 0);
  };

  const resetRoutine = () => {
    setCurrentIndex(0);
    setPaused(false);
    setPhase(PHASES.POSE);
    setRemaining(selectedRoutine?.poses[0]?.duration ?? 0);
  };

  const togglePause = () => setPaused((prev) => !prev);
  const adjustTransitionSeconds = (delta: number) => {
    setTransitionSeconds((prev) => {
      const nextValue = Math.max(MIN_TRANSITION, prev + delta);
      if (isPlaying && phase === PHASES.TRANSITION) {
        setRemaining(nextValue);
      }
      return nextValue;
    });
  };

  if (isPlaying && selectedRoutine) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <RoutinePlayer
          poses={selectedRoutine.poses}
          currentIndex={currentIndex}
          remaining={remaining}
          onPauseResume={togglePause}
          paused={paused}
          onExit={exitRoutine}
          onReset={resetRoutine}
          phase={phase}
          transitionSeconds={transitionSeconds}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.screenTitle}>Yoga Routine Planner</Text>
        <Text style={styles.screenSubtitle}>Pick a body area, tweak durations, start the flow.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.partsRow}>
          {routines.map((routine) => (
            <BodyPartButton
              key={routine.id}
              label={routine.name}
              poseCount={routine.poses.length}
              selected={routine.id === selectedId}
              onPress={() => setSelectedId(routine.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{selectedRoutine?.name}</Text>
              <Text style={styles.cardSubtitle}>{selectedRoutine?.description}</Text>
            </View>
            <View style={styles.cardChip}>
              <Text style={styles.cardChipText}>
                {calculateRoutineTime(selectedRoutine?.poses ?? [], transitionSeconds)}s total
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.metaLabel}>Poses</Text>
              <Text style={styles.metaValue}>{selectedRoutine?.poses.length ?? 0}</Text>
            </View>
            <Pressable style={styles.primaryButton} onPress={startRoutine}>
              <Text style={styles.primaryButtonLabel}>Start Routine</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.transitionCard}>
          <View>
            <Text style={styles.transitionTitle}>Transition Duration</Text>
            <Text style={styles.transitionSubtitle}>
              Time you want between poses before the next hold begins.
            </Text>
          </View>
          <View style={styles.durationControls}>
            <Pressable
              onPress={() => adjustTransitionSeconds(-5)}
              style={[styles.durationButton, styles.durationButtonGhost]}>
              <Text style={styles.durationButtonText}>-5s</Text>
            </Pressable>
            <View style={styles.transitionValueBubble}>
              <Text style={styles.transitionValueText}>{transitionSeconds}s</Text>
            </View>
            <Pressable
              onPress={() => adjustTransitionSeconds(5)}
              style={[styles.durationButton, styles.durationButtonSolid]}>
              <Text style={[styles.durationButtonText, styles.durationButtonSolidText]}>+5s</Text>
            </Pressable>
          </View>
        </View>

        {(selectedRoutine?.poses ?? []).map((pose) => (
          <PoseCard
            key={pose.id}
            pose={pose}
            onChangeDuration={(delta) => handleChangeDuration(pose.id, delta)}
          />
        ))}

        <Text style={styles.tipText}>
          Tip: Adjust per-pose timing and the transition window so the routine feels natural on mobile.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7fbff',
  },
  container: {
    padding: 24,
    paddingBottom: 48,
    gap: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#102548',
  },
  screenSubtitle: {
    fontSize: 15,
    color: '#536079',
  },
  partsRow: {
    marginTop: 4,
  },
  partButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d4dae6',
    marginRight: 12,
    backgroundColor: 'white',
  },
  partButtonActive: {
    backgroundColor: '#e8f1ff',
    borderColor: '#b6d0ff',
  },
  partButtonLabel: {
    fontWeight: '600',
    fontSize: 15,
    color: '#1d2742',
  },
  partButtonLabelActive: {
    color: '#0f3ea3',
  },
  partButtonMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#7a8699',
  },
  partButtonMetaActive: {
    color: '#4a63b1',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0f1b2d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#131d34',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#586173',
    marginTop: 4,
  },
  cardChip: {
    backgroundColor: '#eef5ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  cardChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2850c0',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 12,
    color: '#7d8695',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#142744',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#1a56db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 99,
  },
  primaryButtonLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#cfd6e5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    flex: 1,
    alignItems: 'center',
  },
  secondaryButtonLabel: {
    fontWeight: '600',
    color: '#2b3856',
  },
  transitionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e4e9f3',
  },
  transitionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142744',
  },
  transitionSubtitle: {
    fontSize: 13,
    color: '#6c7688',
    marginTop: 4,
  },
  transitionValueBubble: {
    minWidth: 64,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#eef5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitionValueText: {
    fontWeight: '700',
    color: '#123d9b',
    fontSize: 16,
  },
  poseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#0f1b2d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  poseImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  poseContent: {
    flex: 1,
  },
  poseTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a2443',
  },
  poseSubtitle: {
    fontSize: 13,
    marginTop: 4,
    color: '#6b7587',
  },
  durationControls: {
    flexDirection: 'row',
    gap: 10,
  },
  durationButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  durationButtonGhost: {
    backgroundColor: '#eef1f7',
  },
  durationButtonSolid: {
    backgroundColor: '#163cb7',
  },
  durationButtonText: {
    fontWeight: '600',
    color: '#142744',
  },
  durationButtonSolidText: {
    color: '#fff',
  },
  tipText: {
    fontSize: 13,
    color: '#708094',
    marginTop: 8,
    lineHeight: 20,
  },
  routinePlayer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  routineImage: {
    width: 280,
    height: 280,
    borderRadius: 20,
    marginBottom: 8,
  },
  transitionArtWrapper: {
    width: 280,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#cfe3ff',
    shadowColor: '#0f1b2d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  routinePhase: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f284f',
  },
  routineSubtitle: {
    fontSize: 15,
    color: '#4d5a72',
    textAlign: 'center',
  },
  timerValue: {
    fontSize: 64,
    fontWeight: '800',
    color: '#0f3ea3',
  },
  playerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    width: '100%',
  },
});
