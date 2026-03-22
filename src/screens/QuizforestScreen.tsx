import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  useWindowDimensions,
  Share,
  Image,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quizQuestions, QuizQuestion } from '../data/quiz';

type QuizStage = 'start' | 'question' | 'result';

const QUESTIONS_PER_LEVEL = 7;
const QUIZ_LEVEL_STORAGE_KEY = 'forest_quiz_current_level';

function chunkQuestions(items: QuizQuestion[], size: number): QuizQuestion[][] {
  const result: QuizQuestion[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export default function QuizScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const isSmall = height < 780;
  const isVerySmall = height < 700;

  const levels = useMemo(
    () => chunkQuestions(quizQuestions, QUESTIONS_PER_LEVEL),
    []
  );

  const [levelIndex, setLevelIndex] = useState(0);
  const [stage, setStage] = useState<QuizStage>('start');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(16)).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;

  const currentLevelQuestions = levels[levelIndex] ?? [];
  const currentQuestion = currentLevelQuestions[questionIndex];
  const isLastQuestion = questionIndex === currentLevelQuestions.length - 1;

  const resultTitle =
    score >= Math.ceil(currentLevelQuestions.length / 2)
      ? 'Great job!\nYou did really well!'
      : 'Next time the result will\nbe better!';

  const gnomeWidth = isVerySmall ? 180 : isSmall ? 210 : 250;
  const gnomeHeight = isVerySmall ? 250 : isSmall ? 290 : 340;
  const resultImageWidth = isVerySmall ? 170 : isSmall ? 195 : 230;
  const resultImageHeight = isVerySmall ? 220 : isSmall ? 255 : 300;
  const titleSize = isVerySmall ? 21 : isSmall ? 22 : 24;
  const scoreSize = isVerySmall ? 20 : isSmall ? 22 : 28;
  const answerHeight = isVerySmall ? 48 : isSmall ? 50 : 54;
  const bottomButtonHeight = isVerySmall ? 48 : isSmall ? 50 : 54;
  const questionMinHeight = isVerySmall ? 88 : isSmall ? 94 : 102;
  const bottomSafePad = Math.max(insets.bottom + 86, isVerySmall ? 98 : 110);

  const runAppearAnimation = () => {
    fadeAnim.setValue(0);
    translateAnim.setValue(16);
    scaleAnim.setValue(0.98);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const resetToLevelStart = useCallback(() => {
    setStage('start');
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
  }, []);

  const loadSavedLevel = useCallback(async () => {
    try {
      const savedValue = await AsyncStorage.getItem(QUIZ_LEVEL_STORAGE_KEY);
      const parsed = savedValue ? Number(savedValue) : 0;

      if (Number.isFinite(parsed) && parsed >= 0 && parsed < levels.length) {
        setLevelIndex(parsed);
      } else {
        setLevelIndex(0);
      }
    } catch {
      setLevelIndex(0);
    } finally {
      resetToLevelStart();
      setIsReady(true);
    }
  }, [levels.length, resetToLevelStart]);

  const saveLevel = useCallback(async (nextLevelIndex: number) => {
    try {
      await AsyncStorage.setItem(QUIZ_LEVEL_STORAGE_KEY, String(nextLevelIndex));
    } catch {}
  }, []);

  useEffect(() => {
    loadSavedLevel();
  }, [loadSavedLevel]);

  useFocusEffect(
    useCallback(() => {
      resetToLevelStart();
      runAppearAnimation();
    }, [resetToLevelStart])
  );

  useEffect(() => {
    if (isReady) {
      runAppearAnimation();
    }
  }, [isReady, stage, questionIndex, levelIndex]);

  const handleStart = () => {
    setStage('question');
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
  };

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer || !currentQuestion) {
      return;
    }

    setSelectedAnswer(answer);

    if (answer === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (!selectedAnswer) {
      return;
    }

    if (isLastQuestion) {
      setStage('result');
      return;
    }

    setQuestionIndex(prev => prev + 1);
    setSelectedAnswer(null);
  };

  const handleRestartLevel = () => {
    resetToLevelStart();
  };

  const handleNextLevel = async () => {
    const nextIndex = levelIndex < levels.length - 1 ? levelIndex + 1 : levelIndex;
    setLevelIndex(nextIndex);
    await saveLevel(nextIndex);
    resetToLevelStart();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I completed level ${levelIndex + 1} with score ${score}/${currentLevelQuestions.length}!`,
      });
    } catch {}
  };

  const getAnswerButtonStyle = (answer: string) => {
    if (!selectedAnswer || !currentQuestion) {
      return styles.answerButton;
    }

    if (answer === currentQuestion.correctAnswer) {
      return [styles.answerButton, styles.correctAnswerButton];
    }

    if (answer === selectedAnswer && answer !== currentQuestion.correctAnswer) {
      return [styles.answerButton, styles.wrongAnswerButton];
    }

    return [styles.answerButton, styles.inactiveAnswerButton];
  };

  if (!isReady) {
    return (
      <ImageBackground
        source={require('../assets/images/loading_for_background.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/images/loading_for_background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View
        style={[
          styles.screen,
          {
            paddingTop: insets.top + 16,
            paddingHorizontal: isVerySmall ? 14 : 18,
          },
        ]}
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

        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }, { scale: scaleAnim }],
          }}
        >
          {stage === 'start' && (
            <View
              style={[
                styles.startWrap,
                {
                  paddingBottom: bottomSafePad,
                },
              ]}
            >
              <Text
                style={[
                  styles.startText,
                  {
                    fontSize: titleSize,
                    lineHeight: isVerySmall ? 27 : 30,
                    marginTop: isVerySmall ? 12 : 24,
                  },
                ]}
              >
                The quiz will help you decide{'\n'}what you may or may not know!
              </Text>

              <Text style={styles.levelBadge}>Level {levelIndex + 1}</Text>

              <Image
                source={require('../assets/images/intro_gnome_lantern.png')}
                style={{
                  width: gnomeWidth,
                  height: gnomeHeight,
                  marginTop: isVerySmall ? 18 : 24,
                  marginBottom: isVerySmall ? 18 : 24,
                }}
                resizeMode="contain"
              />

              <TouchableOpacity
                style={[
                  styles.bottomButton,
                  { height: bottomButtonHeight },
                ]}
                activeOpacity={0.85}
                onPress={handleStart}
              >
                <Text style={styles.bottomButtonText}>
                  Start Level {levelIndex + 1}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {stage === 'question' && currentQuestion && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: bottomSafePad,
              }}
            >
              <View style={styles.questionWrap}>
                <Text
                  style={[
                    styles.scoreText,
                    {
                      fontSize: isVerySmall ? 18 : 22,
                      marginTop: isVerySmall ? 6 : 12,
                    },
                  ]}
                >
                  Score: {score}
                </Text>

                <Text
                  style={[
                    styles.levelText,
                    {
                      fontSize: isVerySmall ? 12 : 14,
                    },
                  ]}
                >
                  Level {levelIndex + 1} • Question {questionIndex + 1}/{currentLevelQuestions.length}
                </Text>

                <View
                  style={[
                    styles.questionCard,
                    {
                      minHeight: questionMinHeight,
                      paddingHorizontal: isVerySmall ? 16 : 22,
                      paddingVertical: isVerySmall ? 18 : 22,
                      marginTop: isVerySmall ? 8 : 10,
                      marginBottom: isVerySmall ? 18 : 22,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.questionText,
                      {
                        fontSize: isVerySmall ? 15 : isSmall ? 16 : 18,
                        lineHeight: isVerySmall ? 21 : isSmall ? 22 : 24,
                      },
                    ]}
                  >
                    {currentQuestion.question}
                  </Text>
                </View>

                <View
                  style={[
                    styles.answersWrap,
                    {
                      gap: isVerySmall ? 10 : 12,
                      marginBottom: isVerySmall ? 18 : 26,
                    },
                  ]}
                >
                  {currentQuestion.answers.map(answer => (
                    <TouchableOpacity
                      key={answer}
                      style={[
                        getAnswerButtonStyle(answer),
                        { height: answerHeight },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => handleSelectAnswer(answer)}
                    >
                      <Text
                        style={[
                          styles.answerText,
                          {
                            fontSize: isVerySmall ? 13 : 15,
                          },
                        ]}
                      >
                        {answer}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.bottomButton,
                    { height: bottomButtonHeight },
                    !selectedAnswer && styles.disabledButton,
                  ]}
                  activeOpacity={0.85}
                  onPress={handleNext}
                  disabled={!selectedAnswer}
                >
                  <Text style={styles.bottomButtonText}>
                    {isLastQuestion ? 'Finish Level' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {stage === 'result' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                flexGrow: 1,
                paddingBottom: bottomSafePad,
              }}
            >
              <View style={styles.resultWrap}>
                <Text
                  style={[
                    styles.resultTitle,
                    {
                      fontSize: titleSize,
                      lineHeight: isVerySmall ? 27 : 30,
                      marginTop: isVerySmall ? 8 : 18,
                    },
                  ]}
                >
                  {resultTitle}
                </Text>

                <Text
                  style={[
                    styles.resultScore,
                    {
                      fontSize: scoreSize,
                      marginTop: isVerySmall ? 14 : 18,
                    },
                  ]}
                >
                  Score: {score}
                </Text>

                <Text
                  style={[
                    styles.levelText,
                    {
                      fontSize: isVerySmall ? 12 : 14,
                    },
                  ]}
                >
                  Level {levelIndex + 1} completed
                </Text>

                <Image
                  source={require('../assets/images/intro_gnome_lantern.png')}
                  style={{
                    width: resultImageWidth,
                    height: resultImageHeight,
                    marginTop: isVerySmall ? 14 : 18,
                    marginBottom: isVerySmall ? 10 : 14,
                  }}
                  resizeMode="contain"
                />

                <View style={styles.resultButtonsWrap}>
                  <TouchableOpacity
                    style={[
                      styles.bottomButton,
                      styles.shareButton,
                      { height: bottomButtonHeight },
                    ]}
                    activeOpacity={0.85}
                    onPress={handleShare}
                  >
                    <Text style={styles.bottomButtonText}>Share</Text>
                    <Text style={styles.shareIcon}>↗</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.bottomButton,
                      { height: bottomButtonHeight },
                    ]}
                    activeOpacity={0.85}
                    onPress={handleRestartLevel}
                  >
                    <Text style={styles.bottomButtonText}>Restart</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.bottomButton,
                      { height: bottomButtonHeight },
                    ]}
                    activeOpacity={0.85}
                    onPress={handleNextLevel}
                  >
                    <Text style={styles.bottomButtonText}>
                      {levelIndex < levels.length - 1 ? 'Next Level' : 'Stay on Final Level'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  screen: {
    flex: 1,
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
  startWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  questionWrap: {
    flex: 1,
    alignItems: 'center',
  },
  resultWrap: {
    flexGrow: 1,
    alignItems: 'center',
  },
  startText: {
    color: '#D8EE3B',
    fontWeight: '900',
    textAlign: 'center',
  },
  levelBadge: {
    marginTop: 12,
    color: '#F5F7F0',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreText: {
    color: '#D8EE3B',
    fontWeight: '900',
  },
  levelText: {
    color: '#E7E7D5',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 14,
    textAlign: 'center',
  },
  questionCard: {
    width: '100%',
    borderRadius: 26,
    backgroundColor: 'rgba(109, 58, 24, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 153, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    color: '#FFF9E9',
    fontWeight: '500',
    textAlign: 'center',
  },
  answersWrap: {
    width: '100%',
  },
  answerButton: {
    borderRadius: 27,
    backgroundColor: '#415038',
    borderWidth: 1,
    borderColor: 'rgba(188, 226, 107, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  correctAnswerButton: {
    backgroundColor: '#4C7A2F',
  },
  wrongAnswerButton: {
    backgroundColor: '#6A3D2B',
  },
  inactiveAnswerButton: {
    opacity: 0.75,
  },
  answerText: {
    color: '#F6F7EF',
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomButton: {
    width: '100%',
    borderRadius: 27,
    backgroundColor: '#4B7A39',
    borderWidth: 1,
    borderColor: 'rgba(188, 226, 107, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  bottomButtonText: {
    color: '#F5F7F0',
    fontSize: 18,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.55,
  },
  resultTitle: {
    color: '#D8EE3B',
    fontWeight: '900',
    textAlign: 'center',
  },
  resultScore: {
    color: '#D8EE3B',
    fontWeight: '900',
    textAlign: 'center',
  },
  resultButtonsWrap: {
    width: '100%',
    marginTop: 'auto',
  },
  shareButton: {
    flexDirection: 'row',
    gap: 8,
  },
  shareIcon: {
    color: '#F5F7F0',
    fontSize: 18,
    fontWeight: '800',
  },
});