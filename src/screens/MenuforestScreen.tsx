import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  useWindowDimensions,
  Image,
  Share,
  Modal,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TaskItem = {
  id: string;
  title: string;
  leaves: number;
  text: string;
};

type ActiveTask = TaskItem & {
  done: boolean;
  opened: boolean;
};

const dailyTips = [
  'Every task you finish grows another leaf in your forest 🌿',
  'Even the smallest task can grow into something big',
  'One completed task today makes your forest a little stronger',
  'Your forest grows quietly with every small step you take',
  'Small daily actions slowly turn into great forests',
  'Each leaf in your forest represents a promise you kept',
  'Every task you finish is another seed planted for the future',
  'Progress is like a forest — it grows slowly but surely',
  'Your forest grows stronger every time you choose to act',
  'The gnome smiles every time you complete a task',
  'Great forests are built from many tiny leaves',
  'One task at a time is all it takes to grow a forest',
  'Every little win today becomes a stronger tree tomorrow',
  'A calm mind and a small task can grow great progress',
  'One leaf today, a whole forest tomorrow 🌳',
  'Consistency is the sunlight that helps your forest grow',
  'Even tiny steps can grow into something magical',
  'Your daily efforts slowly turn into a beautiful forest',
  'Another task completed, another leaf joins your tree',
  'Every task you complete makes your forest a little greener',
  'Progress grows best when you nurture it every day',
  'The forest rewards those who keep moving forward',
  'Every leaf in your forest tells a story of progress',
  'Your habits are the roots that grow a strong forest',
  'Every focused moment helps your forest expand',
  'Little victories today will grow into big achievements',
  'Stay patient — even forests take time to grow',
  'Your forest grows with every small promise you keep',
  'Each task is another step deeper into the forest',
  'Keep going — your forest is already growing beautifully 🌿',
];

const allTasks: TaskItem[] = [
  {
    id: '1',
    title: 'Drink a glass of water',
    leaves: 3,
    text: 'Drink one full glass of water to help your body stay hydrated and energized. A simple habit that improves focus and overall well-being.',
  },
  {
    id: '2',
    title: 'Take a 5 minute walk',
    leaves: 5,
    text: 'Step outside or walk around for five minutes. Moving your body and getting fresh air can refresh your mind and improve concentration.',
  },
  {
    id: '3',
    title: 'Clean your desk',
    leaves: 6,
    text: 'Take a few minutes to tidy your workspace. Remove unnecessary items and organize what you need so your desk feels clean and ready for work.',
  },
  {
    id: '4',
    title: 'Stretch for 5 minutes',
    leaves: 5,
    text: 'Do a short stretching session to relax your body, reduce tension, and improve flexibility after sitting or working for a long time.',
  },
  {
    id: '5',
    title: 'Read 5 pages of a book',
    leaves: 6,
    text: 'Spend a few calm minutes reading five pages. It helps you slow down, focus, and build a steady reading habit.',
  },
  {
    id: '6',
    title: 'Write down 3 tasks for today',
    leaves: 4,
    text: 'Create a short and clear task list for the day. Writing down your priorities helps reduce stress and keeps your mind organized.',
  },
  {
    id: '7',
    title: 'Organize one small space',
    leaves: 7,
    text: 'Pick one drawer, shelf, or corner and put it in order. A small organizing step can make your environment feel lighter and calmer.',
  },
  {
    id: '8',
    title: 'Avoid social media for 30 minutes',
    leaves: 7,
    text: 'Take a short break from notifications and feeds. This gives your brain time to rest and helps you stay more present in what you are doing.',
  },
  {
    id: '9',
    title: 'Take a deep breathing break (3 minutes)',
    leaves: 4,
    text: 'Pause for three minutes and focus on slow, deep breaths. This can reduce tension and help you feel more centered.',
  },
  {
    id: '10',
    title: 'Write one idea in your notes',
    leaves: 4,
    text: 'Capture one thought, idea, or plan in your notes. A small written idea can grow into something useful later.',
  },
  {
    id: '11',
    title: 'Complete a small task you postponed',
    leaves: 8,
    text: 'Choose one small thing you have delayed and finish it now. Completing even one postponed task brings relief and momentum.',
  },
  {
    id: '12',
    title: 'Drink two glasses of water',
    leaves: 4,
    text: 'Give yourself a hydration boost by drinking two glasses of water during the day.',
  },
  {
    id: '13',
    title: 'Go outside for fresh air',
    leaves: 5,
    text: 'Spend a few minutes outdoors to reset your mind, breathe deeply, and step away from routine.',
  },
  {
    id: '14',
    title: 'Write a short journal entry',
    leaves: 6,
    text: 'Write a few lines about your day, your thoughts, or how you feel. It helps reflect and release mental clutter.',
  },
  {
    id: '15',
    title: 'Clean up your digital files',
    leaves: 7,
    text: 'Delete or sort a few files on your phone or computer so your digital space feels more organized.',
  },
  {
    id: '16',
    title: 'Focus on one task for 15 minutes',
    leaves: 8,
    text: 'Choose one task and give it your full attention for fifteen minutes without switching focus.',
  },
  {
    id: '17',
    title: 'Review your goals for the week',
    leaves: 7,
    text: 'Look over your weekly goals and remind yourself what matters most right now.',
  },
  {
    id: '18',
    title: 'Do a 10 minute tidy up',
    leaves: 6,
    text: 'Set a timer and clean or organize your space for ten minutes. Small effort, visible result.',
  },
  {
    id: '19',
    title: 'Finish something you started earlier',
    leaves: 9,
    text: 'Return to something unfinished and bring it to completion. Finishing creates a strong sense of progress.',
  },
  {
    id: '20',
    title: 'Take a 10 minute break without screens',
    leaves: 6,
    text: 'Rest your eyes and mind by stepping away from devices for ten minutes.',
  },
  {
    id: '21',
    title: 'Plan tomorrow’s tasks',
    leaves: 7,
    text: 'Write a simple plan for tomorrow so you can start the next day with more clarity.',
  },
  {
    id: '22',
    title: 'Write down one thing you learned today',
    leaves: 5,
    text: 'Notice one useful thing you discovered today and write it down.',
  },
  {
    id: '23',
    title: 'Do a quick posture check and stretch',
    leaves: 4,
    text: 'Check how you are sitting or standing, then do a small stretch to release tension.',
  },
  {
    id: '24',
    title: 'Organize your task list',
    leaves: 6,
    text: 'Review your current tasks and sort them by priority, urgency, or simplicity.',
  },
  {
    id: '25',
    title: 'Drink water and take a short walk',
    leaves: 6,
    text: 'Combine hydration and movement with a glass of water and a short walk.',
  },
  {
    id: '26',
    title: 'Spend 10 minutes reading',
    leaves: 7,
    text: 'Read for ten focused minutes to slow down and strengthen your attention.',
  },
  {
    id: '27',
    title: 'Clean your inbox for 10 minutes',
    leaves: 7,
    text: 'Archive, delete, or reply to messages for ten minutes to reduce digital clutter.',
  },
  {
    id: '28',
    title: 'Do one task you’ve been avoiding',
    leaves: 10,
    text: 'Choose one avoided task and take action on it now. Starting is often the hardest part.',
  },
  {
    id: '29',
    title: 'Practice deep breathing for 5 minutes',
    leaves: 5,
    text: 'Spend five minutes breathing slowly and intentionally to relax your body and mind.',
  },
  {
    id: '30',
    title: 'Declutter one small drawer',
    leaves: 8,
    text: 'Pick one drawer and clear out what you no longer need. Small decluttering feels satisfying.',
  },
  {
    id: '31',
    title: 'Focus without distractions for 20 minutes',
    leaves: 10,
    text: 'Turn away from distractions and work on one thing with full attention for twenty minutes.',
  },
  {
    id: '32',
    title: 'Write a simple to-do list for tomorrow',
    leaves: 6,
    text: 'Prepare a short list for tomorrow to make your next day feel lighter and clearer.',
  },
  {
    id: '33',
    title: 'Do a short 5 minute exercise',
    leaves: 6,
    text: 'Move your body for five minutes with any simple exercise you enjoy.',
  },
  {
    id: '34',
    title: 'Reflect on one positive moment today',
    leaves: 4,
    text: 'Pause and remember one good moment from today, even if it was small.',
  },
  {
    id: '35',
    title: 'Organize your workspace',
    leaves: 8,
    text: 'Arrange your work area so it feels neat, clear, and easier to use.',
  },
  {
    id: '36',
    title: 'Read something educational for 10 minutes',
    leaves: 7,
    text: 'Spend ten minutes learning something useful or interesting.',
  },
  {
    id: '37',
    title: 'Step away from screens for 10 minutes',
    leaves: 5,
    text: 'Take a short break from screens and give your attention a moment to reset.',
  },
  {
    id: '38',
    title: 'Write down a new idea or goal',
    leaves: 5,
    text: 'Capture one new idea, dream, or goal that came to mind today.',
  },
  {
    id: '39',
    title: 'Drink water and stretch',
    leaves: 4,
    text: 'Refresh your body with water and a brief stretch break.',
  },
  {
    id: '40',
    title: 'Do a 15 minute focused work session',
    leaves: 9,
    text: 'Choose one task and work on it with full focus for fifteen minutes.',
  },
  {
    id: '41',
    title: 'Learn something new for 10 minutes',
    leaves: 7,
    text: 'Use ten minutes to explore a new idea, fact, or useful skill.',
  },
  {
    id: '42',
    title: 'Tidy up your room for 10 minutes',
    leaves: 7,
    text: 'Spend ten minutes improving your room so it feels more calm and comfortable.',
  },
  {
    id: '43',
    title: 'Plan your next small goal',
    leaves: 6,
    text: 'Think of one realistic next step and write it down as your next goal.',
  },
  {
    id: '44',
    title: 'Take a mindful breathing pause',
    leaves: 4,
    text: 'Pause for a moment, breathe slowly, and notice how your body feels.',
  },
  {
    id: '45',
    title: "Write down one thing you're grateful for",
    leaves: 4,
    text: 'Notice one thing you appreciate today and write it down.',
  },
  {
    id: '46',
    title: 'Complete a small personal task',
    leaves: 7,
    text: 'Finish one personal responsibility that has been waiting for your attention.',
  },
  {
    id: '47',
    title: 'Avoid distractions for 20 minutes',
    leaves: 9,
    text: 'Give yourself twenty minutes of focused time with no unnecessary interruptions.',
  },
  {
    id: '48',
    title: 'Reflect on your progress today',
    leaves: 5,
    text: 'Look back on what you managed to do today and notice your effort.',
  },
  {
    id: '49',
    title: 'Review your task list',
    leaves: 4,
    text: 'Check your list, update it, and make your next action clearer.',
  },
  {
    id: '50',
    title: 'Complete one meaningful task',
    leaves: 10,
    text: 'Choose one task that matters and finish it fully today.',
  },
];

const createInitialTasks = (): ActiveTask[] => [
  { ...allTasks[0], done: false, opened: false },
  { ...allTasks[1], done: false, opened: false },
  { ...allTasks[2], done: false, opened: false },
];

export default function MenuScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const isVerySmall = height < 700;

  const [tasks, setTasks] = useState<ActiveTask[]>(createInitialTasks());
  const [level, setLevel] = useState(1);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const completedCount = useMemo(
    () => tasks.filter(task => task.done).length,
    [tasks]
  );

  const progressPercent = (completedCount / 3) * 100;

  const handleToggleTaskOpen = (taskId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, opened: !task.opened } : task
      )
    );
  };

  const handleCompleteTask = (taskId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const currentTask = tasks.find(task => task.id === taskId);
    const willBecomeCompleted = currentTask ? !currentTask.done : false;

    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, done: !task.done } : task
      )
    );

    if (willBecomeCompleted && completedCount + 1 === 3) {
      setTimeout(() => {
        setShowLevelModal(true);
      }, 180);
    }
  };

  const handleShareTip = async () => {
    try {
      await Share.share({
        message: dailyTips[tipIndex],
      });
    } catch {}
  };

  const handleShareLevel = async () => {
    try {
      await Share.share({
        message: `I completed all 3 daily tasks and opened level ${level + 1}!`,
      });
    } catch {}
  };

  const handleNextFact = () => {
    setTipIndex(prev => (prev + 1) % dailyTips.length);
  };

  const handleConfirmNewLevel = () => {
    setLevel(prev => prev + 1);
    setShowLevelModal(false);
    setTipIndex(prev => (prev + 1) % dailyTips.length);
    setTasks(createInitialTasks());
  };

  return (
    <ImageBackground
      source={require('../assets/images/loading_for_background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingBottom: Math.max(insets.bottom + 110, 130),
          paddingHorizontal: isVerySmall ? 14 : 18,
        }}
      >
        <View style={styles.topBar}>
          <View />
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.85}
          >
            <Text style={styles.settingsText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tasksCard}>
          <Text style={styles.cardLabel}>Daily tasks</Text>

          {tasks.map(task => (
            <View key={task.id} style={styles.taskItem}>
              <View style={styles.taskRow}>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {task.title} — {task.leaves} leaves
                </Text>

                <TouchableOpacity
                  style={[styles.taskDot, task.done && styles.taskDotDone]}
                  onPress={() => handleCompleteTask(task.id)}
                  activeOpacity={0.85}
                />
              </View>

              {task.opened && (
                <Text style={styles.taskText}>{task.text}</Text>
              )}

              <TouchableOpacity
                style={styles.openButton}
                onPress={() => handleToggleTaskOpen(task.id)}
                activeOpacity={0.85}
              >
                <Text style={styles.openButtonText}>
                  {task.opened ? 'Hide' : 'Open'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.cardLabel}>Daily fact</Text>

          <Text style={styles.tipText}>{dailyTips[tipIndex]}</Text>

          <View style={styles.tipButtonsRow}>
            <TouchableOpacity
              style={[styles.shareButton, styles.tipHalfButton]}
              activeOpacity={0.85}
              onPress={handleShareTip}
            >
              <Text style={styles.shareButtonText}>Share</Text>
              <Text style={styles.shareIcon}>↗</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shareButton, styles.tipHalfButton]}
              activeOpacity={0.85}
              onPress={handleNextFact}
            >
              <Text style={styles.shareButtonText}>Next fact</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.levelCard}>
          <Text style={styles.levelTitle}>LvL {level}</Text>

          <View style={styles.levelRow}>
            <Image
              source={require('../assets/images/intro_growth_pot.png')}
              style={styles.levelImage}
              resizeMode="contain"
            />

            <View style={styles.levelRight}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
                <Text style={styles.progressText}>{completedCount}/3</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.upgradeButton,
                  completedCount < 3 && styles.disabledButton,
                ]}
                onPress={() => {
                  if (completedCount === 3) {
                    setShowLevelModal(true);
                  }
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showLevelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLevelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ImageBackground
            source={require('../assets/images/loading_for_background.png')}
            resizeMode="cover"
            style={styles.modalCard}
            imageStyle={styles.modalBgImage}
          >
            <View style={styles.modalDark} />

            <Text style={styles.modalTitle}>You have opened{"\n"}a new level!</Text>

            <Image
              source={require('../assets/images/intro_gnome_lantern.png')}
              style={styles.modalImage}
              resizeMode="contain"
            />

            <TouchableOpacity
              style={styles.modalShareButton}
              activeOpacity={0.85}
              onPress={handleShareLevel}
            >
              <Text style={styles.modalShareText}>Share</Text>
              <Text style={styles.modalShareIcon}>↗</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOkButton}
              activeOpacity={0.85}
              onPress={handleConfirmNewLevel}
            >
              <Text style={styles.modalOkText}>I understand!</Text>
            </TouchableOpacity>
          </ImageBackground>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 16, 5, 0.2)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#6B3E1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 224, 169, 0.28)',
  },
  settingsText: {
    fontSize: 18,
  },
  tasksCard: {
    backgroundColor: 'rgba(109, 58, 24, 0.96)',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 153, 0.18)',
  },
  cardLabel: {
    color: 'rgba(255, 237, 205, 0.62)',
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 10,
  },
  taskItem: {
    backgroundColor: '#D7B07A',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTitle: {
    flex: 1,
    color: '#54331A',
    fontSize: 12,
    fontWeight: '700',
    paddingRight: 8,
  },
  taskDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F3EFE7',
  },
  taskDotDone: {
    backgroundColor: '#D9F235',
  },
  taskText: {
    marginTop: 9,
    color: '#5B3C20',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
  },
  openButton: {
    marginTop: 10,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3F6F27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openButtonText: {
    color: '#F4F6EA',
    fontSize: 12,
    fontWeight: '800',
  },
  tipCard: {
    backgroundColor: 'rgba(103, 56, 23, 0.96)',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 153, 0.18)',
    marginTop: 12,
  },
  tipText: {
    color: '#FFF9E9',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  tipButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tipHalfButton: {
    flex: 1,
  },
  shareButton: {
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3E7328',
    borderWidth: 1,
    borderColor: 'rgba(188, 226, 107, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareButtonText: {
    color: '#F6F7EF',
    fontSize: 14,
    fontWeight: '800',
  },
  shareIcon: {
    color: '#F6F7EF',
    fontSize: 16,
    fontWeight: '700',
  },
  levelCard: {
    backgroundColor: '#D8B77D',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(92, 56, 20, 0.2)',
    marginTop: 12,
  },
  levelTitle: {
    color: '#5A3719',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelImage: {
    width: 58,
    height: 58,
    marginRight: 12,
  },
  levelRight: {
    flex: 1,
  },
  progressBarBg: {
    height: 18,
    borderRadius: 10,
    backgroundColor: '#E7D5B2',
    overflow: 'hidden',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(96, 58, 20, 0.35)',
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#769B2D',
    borderRadius: 10,
  },
  progressText: {
    alignSelf: 'center',
    color: '#5A3719',
    fontSize: 10,
    fontWeight: '800',
  },
  upgradeButton: {
    height: 34,
    borderRadius: 17,
    backgroundColor: '#3C4A2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonText: {
    color: '#F7F6EE',
    fontSize: 12,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.55,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    minHeight: 520,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 18,
  },
  modalBgImage: {
    borderRadius: 30,
  },
  modalDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.33)',
  },
  modalTitle: {
    color: '#D8EE3B',
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 26,
    marginBottom: 6,
  },
  modalImage: {
    width: 210,
    height: 250,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalShareButton: {
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3E7328',
    borderWidth: 1,
    borderColor: 'rgba(188, 226, 107, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  modalShareText: {
    color: '#F6F7EF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalShareIcon: {
    color: '#F6F7EF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOkButton: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#496E2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOkText: {
    color: '#F6F7EF',
    fontSize: 16,
    fontWeight: '800',
  },
});