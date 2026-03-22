import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Share,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { crosswordLevels, CrosswordLevel, CrosswordPlacement } from '../data/crosswordLevels';

type ScreenStage = 'intro' | 'play' | 'result';

type GridCell = {
  row: number;
  col: number;
  letter: string;
  isActive: boolean;
  number?: number;
  key: string;
};

type NumberedClue = {
  id: string;
  number: number;
  clue: string;
  answer: string;
};

const STORAGE_KEY = 'pots_forest_crossword_unlocked_level';

const KEYBOARD_ROWS = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  ['H', 'I', 'L', 'M', 'N', 'O', 'P'],
  ['Q', 'R', 'S', 'T', 'U', 'V', 'W'],
  ['Y', 'K', 'CLEAR', '⌫'],
];

function createGrid(level: CrosswordLevel) {
  const matrix: Array<Array<GridCell | null>> = Array.from({ length: level.size }, (_, row) =>
    Array.from({ length: level.size }, (_, col) => null)
  );

  level.placements.forEach(placement => {
    const letters = placement.word.toUpperCase().split('');

    letters.forEach((letter, index) => {
      const row = placement.direction === 'across' ? placement.row : placement.row + index;
      const col = placement.direction === 'across' ? placement.col + index : placement.col;

      const existing = matrix[row][col];

      if (existing && existing.letter !== letter) {
        throw new Error(`Crossword conflict in level ${level.id} at row ${row}, col ${col}`);
      }

      matrix[row][col] = {
        row,
        col,
        letter,
        isActive: true,
        key: `${row}-${col}`,
      };
    });
  });

  const cluesAcross: NumberedClue[] = [];
  const cluesDown: NumberedClue[] = [];

  let currentNumber = 1;

  for (let row = 0; row < level.size; row += 1) {
    for (let col = 0; col < level.size; col += 1) {
      const cell = matrix[row][col];
      if (!cell) continue;

      const startsAcross = !!level.placements.find(
        p => p.direction === 'across' && p.row === row && p.col === col
      );
      const startsDown = !!level.placements.find(
        p => p.direction === 'down' && p.row === row && p.col === col
      );

      if (startsAcross || startsDown) {
        matrix[row][col] = {
          ...cell,
          number: currentNumber,
        };

        if (startsAcross) {
          const placement = level.placements.find(
            p => p.direction === 'across' && p.row === row && p.col === col
          ) as CrosswordPlacement;

          cluesAcross.push({
            id: placement.id,
            number: currentNumber,
            clue: placement.clue,
            answer: placement.word.toUpperCase(),
          });
        }

        if (startsDown) {
          const placement = level.placements.find(
            p => p.direction === 'down' && p.row === row && p.col === col
          ) as CrosswordPlacement;

          cluesDown.push({
            id: placement.id,
            number: currentNumber,
            clue: placement.clue,
            answer: placement.word.toUpperCase(),
          });
        }

        currentNumber += 1;
      }
    }
  }

  return {
    matrix,
    cluesAcross,
    cluesDown,
  };
}

function makeEmptyEntries(matrix: Array<Array<GridCell | null>>) {
  const result: Record<string, string> = {};
  matrix.forEach(row => {
    row.forEach(cell => {
      if (cell?.isActive) result[cell.key] = '';
    });
  });
  return result;
}

function getFirstActiveKey(matrix: Array<Array<GridCell | null>>) {
  for (const row of matrix) {
    for (const cell of row) {
      if (cell?.isActive) return cell.key;
    }
  }
  return null;
}

function getActiveKeys(matrix: Array<Array<GridCell | null>>) {
  const keys: string[] = [];
  matrix.forEach(row => {
    row.forEach(cell => {
      if (cell?.isActive) keys.push(cell.key);
    });
  });
  return keys;
}

export default function CrosswordScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmall = height < 780;
  const isVerySmall = height < 700;

  const [stage, setStage] = useState<ScreenStage>('intro');
  const [unlockedLevelIndex, setUnlockedLevelIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [completedLevelIndex, setCompletedLevelIndex] = useState<number | null>(null);
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const moveAnim = useRef(new Animated.Value(18)).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;

  const currentLevel = crosswordLevels[unlockedLevelIndex];
  const { matrix, cluesAcross, cluesDown } = useMemo(
    () => createGrid(currentLevel),
    [currentLevel]
  );

  const activeKeys = useMemo(() => getActiveKeys(matrix), [matrix]);

  const activeCellsCount = useMemo(() => matrix.flat().filter(Boolean).length, [matrix]);
  const progressFilled = useMemo(
    () => Object.values(entries).filter(value => value.trim().length > 0).length,
    [entries]
  );
  const progressPercent = activeCellsCount > 0 ? (progressFilled / activeCellsCount) * 100 : 0;

  const cellSize = useMemo(() => {
    const horizontalPad = isVerySmall ? 44 : isSmall ? 56 : 70;
    const available = width - horizontalPad * 2;
    const raw = Math.floor(available / currentLevel.size);
    return Math.max(20, Math.min(raw, isVerySmall ? 24 : isSmall ? 28 : 32));
  }, [currentLevel.size, width, isSmall, isVerySmall]);

  const keyboardKeyHeight = isVerySmall ? 24 : isSmall ? 26 : 28;
  const keyboardTextSize = isVerySmall ? 9 : 10;
  const introTitleSize = isVerySmall ? 21 : isSmall ? 24 : 28;
  const introTitleLine = isVerySmall ? 27 : isSmall ? 31 : 35;
  const introTextSize = isVerySmall ? 12 : 14;
  const introTextLine = isVerySmall ? 17 : 20;
  const playTitleSize = isVerySmall ? 17 : isSmall ? 19 : 21;
  const buttonHeightMain = isVerySmall ? 42 : isSmall ? 46 : 48;
  const buttonHeightSecondary = isVerySmall ? 40 : isSmall ? 44 : 46;
  const buttonTextSize = isVerySmall ? 14 : 15;
  const clueTitleSize = isVerySmall ? 14 : 15;
  const clueTextSize = isVerySmall ? 11 : 12;
  const clueTextLine = isVerySmall ? 15 : 16;

  const keyboardBlockHeight = isVerySmall ? 122 : isSmall ? 132 : 140;
  const scrollBottomPad = showKeyboard
    ? keyboardBlockHeight + Math.max(insets.bottom + 20, 28)
    : Math.max(insets.bottom + 90, isVerySmall ? 110 : 126);

  const playAppearAnimation = useCallback(() => {
    fadeAnim.setValue(0);
    moveAnim.setValue(18);
    scaleAnim.setValue(0.98);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(moveAnim, {
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
  }, [fadeAnim, moveAnim, scaleAnim]);

  const resetToIntro = useCallback(() => {
    setStage('intro');
    setEntries(makeEmptyEntries(matrix));
    setCompletedLevelIndex(null);
    setSelectedCellKey(getFirstActiveKey(matrix));
    setShowKeyboard(false);
  }, [matrix]);

  const loadProgress = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? Number(raw) : 0;

      if (Number.isFinite(parsed) && parsed >= 0 && parsed < crosswordLevels.length) {
        setUnlockedLevelIndex(parsed);
      } else {
        setUnlockedLevelIndex(0);
      }
    } catch {
      setUnlockedLevelIndex(0);
    } finally {
      setIsReady(true);
    }
  }, []);

  const saveProgress = useCallback(async (nextIndex: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(nextIndex));
    } catch {}
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    if (isReady) {
      setEntries(makeEmptyEntries(matrix));
      setStage('intro');
      setCompletedLevelIndex(null);
      setSelectedCellKey(getFirstActiveKey(matrix));
      setShowKeyboard(false);
      playAppearAnimation();
    }
  }, [isReady, matrix, playAppearAnimation]);

  useFocusEffect(
    useCallback(() => {
      if (isReady) {
        setStage('intro');
        setEntries(makeEmptyEntries(matrix));
        setCompletedLevelIndex(null);
        setSelectedCellKey(getFirstActiveKey(matrix));
        setShowKeyboard(false);
        playAppearAnimation();
      }
    }, [isReady, matrix, playAppearAnimation])
  );

  useEffect(() => {
    if (isReady) {
      playAppearAnimation();
    }
  }, [stage, unlockedLevelIndex, playAppearAnimation, isReady]);

  const moveSelectionToNext = useCallback(
    (fromKey: string) => {
      const index = activeKeys.indexOf(fromKey);
      if (index === -1) return;
      const nextKey = activeKeys[index + 1] ?? fromKey;
      setSelectedCellKey(nextKey);
    },
    [activeKeys]
  );

  const moveSelectionToPrev = useCallback(
    (fromKey: string) => {
      const index = activeKeys.indexOf(fromKey);
      if (index === -1) return;
      const prevKey = activeKeys[index - 1] ?? fromKey;
      setSelectedCellKey(prevKey);
    },
    [activeKeys]
  );

  const handleKeyboardPress = (value: string) => {
    if (!selectedCellKey) return;

    if (value === 'CLEAR') {
      setEntries(makeEmptyEntries(matrix));
      setSelectedCellKey(getFirstActiveKey(matrix));
      return;
    }

    if (value === '⌫') {
      setEntries(prev => ({
        ...prev,
        [selectedCellKey]: '',
      }));
      moveSelectionToPrev(selectedCellKey);
      return;
    }

    setEntries(prev => ({
      ...prev,
      [selectedCellKey]: value,
    }));
    moveSelectionToNext(selectedCellKey);
  };

  const handleOpenCrossword = () => {
    const empty = makeEmptyEntries(matrix);
    setEntries(empty);
    setSelectedCellKey(getFirstActiveKey(matrix));
    setShowKeyboard(false);
    setStage('play');
  };

  const handleClear = () => {
    setEntries(makeEmptyEntries(matrix));
    setSelectedCellKey(getFirstActiveKey(matrix));
  };

  const handleCellPress = (cellKey: string) => {
    setSelectedCellKey(cellKey);
    setShowKeyboard(true);
  };

  const handleCheck = async () => {
    const hasEmpty = Object.values(entries).some(value => !value.trim());

    if (hasEmpty) {
      Alert.alert('Fill all cells', 'Please complete the whole crossword first.');
      return;
    }

    const isCorrect = matrix.every(row =>
      row.every(cell => {
        if (!cell?.isActive) return true;
        return (entries[cell.key] || '').toUpperCase() === cell.letter.toUpperCase();
      })
    );

    if (!isCorrect) {
      Alert.alert('Not yet', 'Some letters are incorrect. Check the clues and try again.');
      return;
    }

    setCompletedLevelIndex(unlockedLevelIndex);
    setShowKeyboard(false);

    if (unlockedLevelIndex < crosswordLevels.length - 1) {
      const nextLevel = unlockedLevelIndex + 1;
      setUnlockedLevelIndex(nextLevel);
      await saveProgress(nextLevel);
    } else {
      await saveProgress(unlockedLevelIndex);
    }

    setStage('result');
  };

  const handleNextLevel = () => {
    const nextMatrix = createGrid(crosswordLevels[unlockedLevelIndex]).matrix;
    setEntries(makeEmptyEntries(nextMatrix));
    setSelectedCellKey(getFirstActiveKey(nextMatrix));
    setShowKeyboard(false);
    setStage('intro');
  };

  const handleRestartLevel = () => {
    const levelToShow = crosswordLevels[completedLevelIndex ?? unlockedLevelIndex];
    const levelMatrix = createGrid(levelToShow).matrix;
    setEntries(makeEmptyEntries(levelMatrix));
    setSelectedCellKey(getFirstActiveKey(levelMatrix));
    setShowKeyboard(false);
    setStage('intro');
  };

  const handleShare = async () => {
    try {
      const shownLevel = (completedLevelIndex ?? unlockedLevelIndex) + 1;
      await Share.share({
        message: `I completed crossword level ${shownLevel} in Pots of Forest Leaves!`,
      });
    } catch {}
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
            paddingTop: insets.top + 12,
            paddingHorizontal: isVerySmall ? 10 : 12,
          },
        ]}
      >
        <View style={styles.topBar}>
          <View />
          <TouchableOpacity
            style={styles.settingsButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.settingsText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.animatedWrap,
            {
              opacity: fadeAnim,
              transform: [{ translateY: moveAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {stage === 'intro' && (
            <View style={[styles.centerWrap, { paddingBottom: scrollBottomPad }]}>
              <Text
                style={[
                  styles.introTitle,
                  {
                    fontSize: introTitleSize,
                    lineHeight: introTitleLine,
                  },
                ]}
              >
                Leaf Crossword
              </Text>

              <Text style={styles.introLevel}>{currentLevel.title}</Text>

              <Text
                style={[
                  styles.introText,
                  {
                    fontSize: introTextSize,
                    lineHeight: introTextLine,
                    maxWidth: isVerySmall ? 290 : 320,
                  },
                ]}
              >
                {currentLevel.intro}
              </Text>

              <Image
                source={require('../assets/images/intro_gnome_progress.png')}
                style={{
                  width: isVerySmall ? 160 : isSmall ? 210 : 250,
                  height: isVerySmall ? 200 : isSmall ? 270 : 320,
                  marginTop: isVerySmall ? 14 : 20,
                  marginBottom: isVerySmall ? 18 : 24,
                }}
                resizeMode="contain"
              />

              <TouchableOpacity
                style={[styles.mainButton, { height: buttonHeightMain }]}
                activeOpacity={0.85}
                onPress={handleOpenCrossword}
              >
                <Text style={[styles.mainButtonText, { fontSize: buttonTextSize }]}>
                  Open crossword
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {stage === 'play' && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: scrollBottomPad,
              }}
            >
              <View style={styles.playWrap}>
                <Text style={[styles.playTitle, { fontSize: playTitleSize }]}>
                  {currentLevel.title}
                </Text>

                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(progressPercent, 100)}%` },
                    ]}
                  />
                  <Text style={styles.progressText}>
                    {progressFilled}/{activeCellsCount}
                  </Text>
                </View>

                <View style={[styles.gridWrap, { padding: isVerySmall ? 4 : 6 }]}>
                  {matrix.map((row, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={styles.gridRow}>
                      {row.map((cell, colIndex) => {
                        if (!cell) {
                          return (
                            <View
                              key={`block-${rowIndex}-${colIndex}`}
                              style={[
                                styles.blockCell,
                                {
                                  width: cellSize,
                                  height: cellSize,
                                },
                              ]}
                            />
                          );
                        }

                        const isSelected = selectedCellKey === cell.key;

                        return (
                          <TouchableOpacity
                            key={cell.key}
                            activeOpacity={0.85}
                            onPress={() => handleCellPress(cell.key)}
                            style={[
                              styles.activeCell,
                              isSelected && styles.selectedCell,
                              {
                                width: cellSize,
                                height: cellSize,
                              },
                            ]}
                          >
                            {!!cell.number && (
                              <Text style={styles.cellNumber}>{cell.number}</Text>
                            )}

                            <Text
                              style={[
                                styles.cellLetter,
                                {
                                  fontSize: isVerySmall ? 13 : 16,
                                },
                              ]}
                            >
                              {entries[cell.key] ?? ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>

                {showKeyboard && (
                  <View style={styles.inlineKeyboardWrap}>
                    <View style={styles.selectedBox}>
                      <Text style={styles.selectedBoxText}>
                        Selected: {selectedCellKey ?? '—'}
                      </Text>
                    </View>

                    {KEYBOARD_ROWS.map((row, rowIndex) => (
                      <View key={`kb-row-${rowIndex}`} style={styles.keyboardRow}>
                        {row.map(key => {
                          const isWide = key === 'CLEAR';
                          const isBack = key === '⌫';

                          return (
                            <TouchableOpacity
                              key={key}
                              activeOpacity={0.85}
                              style={[
                                styles.keyButton,
                                isWide && styles.keyButtonWide,
                                isBack && styles.keyButtonBackspace,
                                {
                                  height: keyboardKeyHeight,
                                },
                              ]}
                              onPress={() => handleKeyboardPress(key)}
                            >
                              <Text
                                style={[
                                  styles.keyButtonText,
                                  {
                                    fontSize: keyboardTextSize,
                                  },
                                ]}
                              >
                                {key}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.cluesCard}>
                  <Text style={[styles.cluesTitle, { fontSize: clueTitleSize }]}>Across</Text>
                  {cluesAcross.map(clue => (
                    <Text
                      key={clue.id}
                      style={[
                        styles.clueText,
                        {
                          fontSize: clueTextSize,
                          lineHeight: clueTextLine,
                        },
                      ]}
                    >
                      {clue.number}. {clue.clue}
                    </Text>
                  ))}

                  <Text
                    style={[
                      styles.cluesTitle,
                      {
                        marginTop: 10,
                        fontSize: clueTitleSize,
                      },
                    ]}
                  >
                    Down
                  </Text>
                  {cluesDown.map(clue => (
                    <Text
                      key={clue.id}
                      style={[
                        styles.clueText,
                        {
                          fontSize: clueTextSize,
                          lineHeight: clueTextLine,
                        },
                      ]}
                    >
                      {clue.number}. {clue.clue}
                    </Text>
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.mainButton, { height: buttonHeightMain }]}
                  activeOpacity={0.85}
                  onPress={handleCheck}
                >
                  <Text style={[styles.mainButtonText, { fontSize: buttonTextSize }]}>
                    Check level
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryButton, { height: buttonHeightSecondary }]}
                  activeOpacity={0.85}
                  onPress={handleClear}
                >
                  <Text style={[styles.secondaryButtonText, { fontSize: buttonTextSize - 1 }]}>
                    Clear
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
                paddingBottom: scrollBottomPad,
              }}
            >
              <View style={styles.centerWrap}>
                <Text
                  style={[
                    styles.introTitle,
                    {
                      fontSize: introTitleSize,
                      lineHeight: introTitleLine,
                    },
                  ]}
                >
                  Level complete!
                </Text>

                <Text style={styles.resultLevel}>
                  You solved level {(completedLevelIndex ?? unlockedLevelIndex) + 1}
                </Text>

                <Image
                  source={require('../assets/images/intro_gnome_lantern.png')}
                  style={{
                    width: isVerySmall ? 155 : isSmall ? 195 : 230,
                    height: isVerySmall ? 195 : isSmall ? 250 : 295,
                    marginTop: isVerySmall ? 10 : 16,
                    marginBottom: isVerySmall ? 12 : 18,
                  }}
                  resizeMode="contain"
                />

                <TouchableOpacity
                  style={[styles.mainButton, styles.shareButton, { height: buttonHeightMain }]}
                  activeOpacity={0.85}
                  onPress={handleShare}
                >
                  <Text style={[styles.mainButtonText, { fontSize: buttonTextSize }]}>Share</Text>
                  <Text style={styles.shareIcon}>↗</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mainButton, { height: buttonHeightMain }]}
                  activeOpacity={0.85}
                  onPress={handleNextLevel}
                >
                  <Text style={[styles.mainButtonText, { fontSize: buttonTextSize }]}>
                    {unlockedLevelIndex < crosswordLevels.length
                      ? `Go to ${crosswordLevels[unlockedLevelIndex].title}`
                      : 'Open crossword'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryButton, { height: buttonHeightSecondary }]}
                  activeOpacity={0.85}
                  onPress={handleRestartLevel}
                >
                  <Text style={[styles.secondaryButtonText, { fontSize: buttonTextSize - 1 }]}>
                    Replay intro
                  </Text>
                </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.26)',
  },
  screen: {
    flex: 1,
  },
  animatedWrap: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6B3E1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 224, 169, 0.28)',
  },
  settingsText: {
    fontSize: 16,
  },
  centerWrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  introTitle: {
    color: '#D8EE3B',
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 14,
  },
  introLevel: {
    color: '#F5F7F0',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  introText: {
    color: '#FFF8E8',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
  },
  playWrap: {
    alignItems: 'center',
  },
  playTitle: {
    color: '#D8EE3B',
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  progressBarBg: {
    width: '100%',
    height: 16,
    borderRadius: 8,
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
    borderRadius: 8,
  },
  progressText: {
    alignSelf: 'center',
    color: '#5A3719',
    fontSize: 9,
    fontWeight: '800',
  },
  gridWrap: {
    borderRadius: 16,
    backgroundColor: 'rgba(109, 58, 24, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 153, 0.18)',
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: 'row',
  },
  blockCell: {
    margin: 1.5,
    borderRadius: 5,
    backgroundColor: 'rgba(35, 22, 12, 0.45)',
  },
  activeCell: {
    margin: 1.5,
    borderRadius: 5,
    backgroundColor: '#F4E2BF',
    borderWidth: 1,
    borderColor: 'rgba(96, 58, 20, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedCell: {
    borderColor: '#D8EE3B',
    borderWidth: 2,
  },
  cellNumber: {
    position: 'absolute',
    top: 1,
    left: 2,
    fontSize: 6,
    color: '#6A4523',
    fontWeight: '800',
  },
  cellLetter: {
    color: '#533218',
    fontWeight: '900',
    textAlign: 'center',
  },
  inlineKeyboardWrap: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: 'rgba(32, 22, 14, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 153, 0.10)',
    paddingTop: 3,
    paddingHorizontal: 3,
    paddingBottom: 4,
    marginBottom: 10,
  },
  selectedBox: {
    alignSelf: 'center',
    minWidth: 78,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(109, 58, 24, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 3,
  },
  selectedBoxText: {
    color: '#FFF8E8',
    fontSize: 8,
    fontWeight: '700',
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 2,
    marginTop: 2,
  },
  keyButton: {
    flex: 1,
    borderRadius: 7,
    backgroundColor: '#4B7A39',
    borderWidth: 1,
    borderColor: 'rgba(188, 226, 107, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 1,
  },
  keyButtonWide: {
    flex: 1.8,
  },
  keyButtonBackspace: {
    flex: 1.15,
    backgroundColor: '#6B3E1E',
    borderColor: 'rgba(255, 224, 169, 0.20)',
  },
  keyButtonText: {
    color: '#F5F7F0',
    fontWeight: '800',
    textAlign: 'center',
  },
  cluesCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(63, 109, 34, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(202, 226, 99, 0.42)',
    padding: 10,
    marginBottom: 10,
  },
  cluesTitle: {
    color: '#F3F7EA',
    fontWeight: '800',
    marginBottom: 6,
  },
  clueText: {
    color: '#E7ECD6',
    marginBottom: 4,
  },
  mainButton: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#4B7A39',
    borderWidth: 1,
    borderColor: 'rgba(188, 226, 107, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  secondaryButton: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: 'rgba(109, 58, 24, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 153, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  mainButtonText: {
    color: '#F5F7F0',
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: '#FFF8E8',
    fontWeight: '700',
  },
  resultLevel: {
    color: '#FFF8E8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    gap: 8,
  },
  shareIcon: {
    color: '#F5F7F0',
    fontSize: 15,
    fontWeight: '800',
  },
});