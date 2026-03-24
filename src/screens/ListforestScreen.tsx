import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  ImageBackground,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { crosswordLevels, CrosswordLevel, CrosswordPlacement } from '../data/crosswordLevels';

type ScreenStage = 'intro' | 'play' | 'result';
type WordDirection = 'across' | 'down';

type GridCell = {
  row: number;
  col: number;
  letter: string;
  isActive: boolean;
  number?: number;
  key: string;
  acrossWordIds: string[];
  downWordIds: string[];
};

type NumberedClue = {
  id: string;
  number: number;
  clue: string;
  answer: string;
  direction: WordDirection;
  startKey: string;
  cellKeys: string[];
};

type WordMapItem = {
  id: string;
  clue: string;
  answer: string;
  direction: WordDirection;
  number: number;
  startKey: string;
  cellKeys: string[];
};

const STORAGE_KEY = 'pots_forest_crossword_unlocked_level';

const KEYBOARD_ROWS = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
  ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z', 'CLEAR', '⌫'],
];

function buildWordCellKeys(placement: CrosswordPlacement) {
  return placement.word
    .toUpperCase()
    .split('')
    .map((_, index) => {
      const row = placement.direction === 'across' ? placement.row : placement.row + index;
      const col = placement.direction === 'across' ? placement.col + index : placement.col;
      return `${row}-${col}`;
    });
}

function createGrid(level: CrosswordLevel) {
  const matrix: Array<Array<GridCell | null>> = Array.from({ length: level.size }, (_, row) =>
    Array.from({ length: level.size }, (_, col) => null)
  );

  const startMap = new Map<string, CrosswordPlacement[]>();

  level.placements.forEach(placement => {
    const letters = placement.word.toUpperCase().split('');

    letters.forEach((letter, index) => {
      const row = placement.direction === 'across' ? placement.row : placement.row + index;
      const col = placement.direction === 'across' ? placement.col + index : placement.col;
      const key = `${row}-${col}`;

      const existing = matrix[row][col];

      if (existing && existing.letter !== letter) {
        throw new Error(`Crossword conflict in level ${level.id} at row ${row}, col ${col}`);
      }

      if (!existing) {
        matrix[row][col] = {
          row,
          col,
          letter,
          isActive: true,
          key,
          acrossWordIds: [],
          downWordIds: [],
        };
      }

      const current = matrix[row][col] as GridCell;

      if (placement.direction === 'across') {
        current.acrossWordIds = [...new Set([...current.acrossWordIds, placement.id])];
      } else {
        current.downWordIds = [...new Set([...current.downWordIds, placement.id])];
      }
    });

    const startKey = `${placement.row}-${placement.col}`;
    const existingStarts = startMap.get(startKey) ?? [];
    startMap.set(startKey, [...existingStarts, placement]);
  });

  const wordsById: Record<string, WordMapItem> = {};
  const cluesAcross: NumberedClue[] = [];
  const cluesDown: NumberedClue[] = [];

  let currentNumber = 1;

  for (let row = 0; row < level.size; row += 1) {
    for (let col = 0; col < level.size; col += 1) {
      const key = `${row}-${col}`;
      const cell = matrix[row][col];
      if (!cell) continue;

      const startsHere = startMap.get(key) ?? [];

      if (startsHere.length > 0) {
        matrix[row][col] = {
          ...cell,
          number: currentNumber,
        };

        startsHere.forEach(placement => {
          const cellKeys = buildWordCellKeys(placement);

          const item: WordMapItem = {
            id: placement.id,
            clue: placement.clue,
            answer: placement.word.toUpperCase(),
            direction: placement.direction,
            number: currentNumber,
            startKey: key,
            cellKeys,
          };

          wordsById[placement.id] = item;

          const clueItem: NumberedClue = {
            id: placement.id,
            number: currentNumber,
            clue: placement.clue,
            answer: placement.word.toUpperCase(),
            direction: placement.direction,
            startKey: key,
            cellKeys,
          };

          if (placement.direction === 'across') {
            cluesAcross.push(clueItem);
          } else {
            cluesDown.push(clueItem);
          }
        });

        currentNumber += 1;
      }
    }
  }

  return {
    matrix,
    cluesAcross,
    cluesDown,
    wordsById,
  };
}

function makeEmptyEntries(matrix: Array<Array<GridCell | null>>) {
  const result: Record<string, string> = {};
  matrix.forEach(row => {
    row.forEach(cell => {
      if (cell?.isActive) {
        result[cell.key] = '';
      }
    });
  });
  return result;
}

function getFirstWordId(wordsById: Record<string, WordMapItem>) {
  const sorted = Object.values(wordsById).sort((a, b) => {
    if (a.number !== b.number) return a.number - b.number;
    if (a.direction === b.direction) return 0;
    return a.direction === 'across' ? -1 : 1;
  });

  return sorted[0]?.id ?? null;
}

function getCellByKey(matrix: Array<Array<GridCell | null>>, key: string | null) {
  if (!key) return null;
  const [rowText, colText] = key.split('-');
  const row = Number(rowText);
  const col = Number(colText);
  if (Number.isNaN(row) || Number.isNaN(col)) return null;
  return matrix[row]?.[col] ?? null;
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
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<WordDirection>('across');
  const [showKeyboard, setShowKeyboard] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const moveAnim = useRef(new Animated.Value(18)).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;

  const currentLevel = crosswordLevels[unlockedLevelIndex];

  const { matrix, cluesAcross, cluesDown, wordsById } = useMemo(() => {
    return createGrid(currentLevel);
  }, [currentLevel]);

  const selectedWord = selectedWordId ? wordsById[selectedWordId] ?? null : null;

  const activeCellsCount = useMemo(() => {
    return matrix.flat().filter(Boolean).length;
  }, [matrix]);

  const progressFilled = useMemo(() => {
    return Object.values(entries).filter(value => value.trim().length > 0).length;
  }, [entries]);

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

  const applyInitialSelection = useCallback(() => {
    const firstWordId = getFirstWordId(wordsById);
    const firstWord = firstWordId ? wordsById[firstWordId] : null;
    setSelectedWordId(firstWordId);
    setSelectedDirection(firstWord?.direction ?? 'across');
    setSelectedCellKey(firstWord?.cellKeys[0] ?? null);
  }, [wordsById]);

  const loadProgress = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = saved ? Number(saved) : 0;

      if (!Number.isNaN(parsed) && parsed >= 0 && parsed < crosswordLevels.length) {
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
    if (!isReady) return;
    setEntries(makeEmptyEntries(matrix));
    setStage('intro');
    setCompletedLevelIndex(null);
    setShowKeyboard(false);
    applyInitialSelection();
    playAppearAnimation();
  }, [isReady, matrix, applyInitialSelection, playAppearAnimation]);

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;
      setStage('intro');
      setEntries(makeEmptyEntries(matrix));
      setCompletedLevelIndex(null);
      setShowKeyboard(false);
      applyInitialSelection();
      playAppearAnimation();
    }, [isReady, matrix, applyInitialSelection, playAppearAnimation])
  );

  useEffect(() => {
    if (isReady) {
      playAppearAnimation();
    }
  }, [stage, unlockedLevelIndex, playAppearAnimation, isReady]);

  const selectWord = useCallback(
    (wordId: string, preferredCellKey?: string | null) => {
      const word = wordsById[wordId];
      if (!word) return;

      setSelectedWordId(wordId);
      setSelectedDirection(word.direction);

      if (preferredCellKey && word.cellKeys.includes(preferredCellKey)) {
        setSelectedCellKey(preferredCellKey);
      } else {
        const firstEmptyKey = word.cellKeys.find(key => !(entries[key] ?? '').trim());
        setSelectedCellKey(firstEmptyKey ?? word.cellKeys[0] ?? null);
      }

      setShowKeyboard(true);
    },
    [entries, wordsById]
  );

  const moveSelectionInsideWord = useCallback(
    (directionStep: 1 | -1, fromKey?: string | null) => {
      if (!selectedWord) return;
      const currentKey = fromKey ?? selectedCellKey;
      const currentIndex = selectedWord.cellKeys.indexOf(currentKey ?? '');

      if (currentIndex === -1) {
        setSelectedCellKey(selectedWord.cellKeys[0] ?? null);
        return;
      }

      const nextIndex = currentIndex + directionStep;

      if (nextIndex < 0) {
        setSelectedCellKey(selectedWord.cellKeys[0] ?? null);
        return;
      }

      if (nextIndex >= selectedWord.cellKeys.length) {
        setSelectedCellKey(selectedWord.cellKeys[selectedWord.cellKeys.length - 1] ?? null);
        return;
      }

      setSelectedCellKey(selectedWord.cellKeys[nextIndex]);
    },
    [selectedCellKey, selectedWord]
  );

  const handleKeyboardPress = useCallback(
    (value: string) => {
      if (!selectedCellKey || !selectedWord) return;

      if (value === 'CLEAR') {
        const nextEntries = { ...entries };
        selectedWord.cellKeys.forEach(key => {
          nextEntries[key] = '';
        });
        setEntries(nextEntries);
        setSelectedCellKey(selectedWord.cellKeys[0] ?? null);
        return;
      }

      if (value === '⌫') {
        const currentValue = entries[selectedCellKey] ?? '';

        if (currentValue) {
          setEntries(prev => ({
            ...prev,
            [selectedCellKey]: '',
          }));
          return;
        }

        const currentIndex = selectedWord.cellKeys.indexOf(selectedCellKey);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        const prevKey = selectedWord.cellKeys[prevIndex] ?? selectedCellKey;

        setEntries(prev => ({
          ...prev,
          [prevKey]: '',
        }));
        setSelectedCellKey(prevKey);
        return;
      }

      setEntries(prev => ({
        ...prev,
        [selectedCellKey]: value,
      }));

      const currentIndex = selectedWord.cellKeys.indexOf(selectedCellKey);
      const nextIndex = currentIndex + 1;

      if (nextIndex < selectedWord.cellKeys.length) {
        setSelectedCellKey(selectedWord.cellKeys[nextIndex]);
      }
    },
    [entries, selectedCellKey, selectedWord]
  );

  const handleOpenCrossword = useCallback(() => {
    setEntries(makeEmptyEntries(matrix));
    applyInitialSelection();
    setShowKeyboard(true);
    setStage('play');
  }, [matrix, applyInitialSelection]);

  const handleClear = useCallback(() => {
    setEntries(makeEmptyEntries(matrix));
    applyInitialSelection();
  }, [matrix, applyInitialSelection]);

  const handleCellPress = useCallback(
    (cellKey: string) => {
      const cell = getCellByKey(matrix, cellKey);
      if (!cell) return;

      const hasAcross = cell.acrossWordIds.length > 0;
      const hasDown = cell.downWordIds.length > 0;

      if (hasAcross && hasDown) {
        if (selectedCellKey === cellKey) {
          if (selectedDirection === 'across') {
            const nextWordId = cell.downWordIds[0];
            if (nextWordId) {
              selectWord(nextWordId, cellKey);
              return;
            }
          } else {
            const nextWordId = cell.acrossWordIds[0];
            if (nextWordId) {
              selectWord(nextWordId, cellKey);
              return;
            }
          }
        }

        const currentWordFits =
          selectedWord &&
          selectedWord.cellKeys.includes(cellKey) &&
          selectedWord.direction === selectedDirection;

        if (currentWordFits) {
          setSelectedCellKey(cellKey);
          setShowKeyboard(true);
          return;
        }

        const preferredWordId =
          selectedDirection === 'across'
            ? cell.acrossWordIds[0] ?? cell.downWordIds[0]
            : cell.downWordIds[0] ?? cell.acrossWordIds[0];

        if (preferredWordId) {
          selectWord(preferredWordId, cellKey);
        }
        return;
      }

      if (hasAcross) {
        const wordId = cell.acrossWordIds[0];
        if (wordId) {
          selectWord(wordId, cellKey);
        }
        return;
      }

      if (hasDown) {
        const wordId = cell.downWordIds[0];
        if (wordId) {
          selectWord(wordId, cellKey);
        }
      }
    },
    [matrix, selectedCellKey, selectedDirection, selectedWord, selectWord]
  );

  const handleCluePress = useCallback(
    (clueId: string) => {
      selectWord(clueId);
    },
    [selectWord]
  );

  const handleCheck = useCallback(async () => {
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
  }, [entries, matrix, saveProgress, unlockedLevelIndex]);

  const handleNextLevel = useCallback(() => {
    const nextLevel = crosswordLevels[unlockedLevelIndex];
    const nextGrid = createGrid(nextLevel);
    setEntries(makeEmptyEntries(nextGrid.matrix));
    const firstWordId = getFirstWordId(nextGrid.wordsById);
    const firstWord = firstWordId ? nextGrid.wordsById[firstWordId] : null;
    setSelectedWordId(firstWordId);
    setSelectedDirection(firstWord?.direction ?? 'across');
    setSelectedCellKey(firstWord?.cellKeys[0] ?? null);
    setShowKeyboard(false);
    setStage('intro');
  }, [unlockedLevelIndex]);

  const handleRestartLevel = useCallback(() => {
    const levelToShow = crosswordLevels[completedLevelIndex ?? unlockedLevelIndex];
    const levelGrid = createGrid(levelToShow);
    setEntries(makeEmptyEntries(levelGrid.matrix));
    const firstWordId = getFirstWordId(levelGrid.wordsById);
    const firstWord = firstWordId ? levelGrid.wordsById[firstWordId] : null;
    setSelectedWordId(firstWordId);
    setSelectedDirection(firstWord?.direction ?? 'across');
    setSelectedCellKey(firstWord?.cellKeys[0] ?? null);
    setShowKeyboard(false);
    setStage('intro');
  }, [completedLevelIndex, unlockedLevelIndex]);

  const handleShare = useCallback(async () => {
    try {
      const shownLevel = (completedLevelIndex ?? unlockedLevelIndex) + 1;
      await Share.share({
        message: `I completed crossword level ${shownLevel} in Pots of Forest Leaves!`,
      });
    } catch {}
  }, [completedLevelIndex, unlockedLevelIndex]);

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

                {selectedWord ? (
                  <View style={styles.selectedWordWrap}>
                    <Text style={styles.selectedWordLabel}>
                      {selectedWord.direction === 'across' ? 'Across' : 'Down'} {selectedWord.number}
                    </Text>
                    <Text style={styles.selectedWordText}>{selectedWord.clue}</Text>
                  </View>
                ) : null}

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
                        const isInSelectedWord =
                          selectedWord?.cellKeys.includes(cell.key) ?? false;

                        return (
                          <TouchableOpacity
                            key={cell.key}
                            activeOpacity={0.85}
                            onPress={() => handleCellPress(cell.key)}
                            style={[
                              styles.activeCell,
                              isInSelectedWord && styles.wordCell,
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
                        {selectedWord
                          ? `${selectedWord.direction === 'across' ? 'Across' : 'Down'} ${selectedWord.number}`
                          : 'Selected'}
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

                <View style={styles.cluesWrap}>
                  <Text
                    style={[
                      styles.cluesTitle,
                      {
                        fontSize: clueTitleSize,
                      },
                    ]}
                  >
                    Across
                  </Text>

                  {cluesAcross.map(clue => {
                    const isActive = selectedWordId === clue.id;

                    return (
                      <TouchableOpacity
                        key={clue.id}
                        activeOpacity={0.85}
                        onPress={() => handleCluePress(clue.id)}
                        style={[styles.clueButton, isActive && styles.clueButtonActive]}
                      >
                        <Text
                          style={[
                            styles.clueText,
                            isActive && styles.clueTextActive,
                            {
                              fontSize: clueTextSize,
                              lineHeight: clueTextLine,
                            },
                          ]}
                        >
                          {clue.number}. {clue.clue}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

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

                  {cluesDown.map(clue => {
                    const isActive = selectedWordId === clue.id;

                    return (
                      <TouchableOpacity
                        key={clue.id}
                        activeOpacity={0.85}
                        onPress={() => handleCluePress(clue.id)}
                        style={[styles.clueButton, isActive && styles.clueButtonActive]}
                      >
                        <Text
                          style={[
                            styles.clueText,
                            isActive && styles.clueTextActive,
                            {
                              fontSize: clueTextSize,
                              lineHeight: clueTextLine,
                            },
                          ]}
                        >
                          {clue.number}. {clue.clue}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
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
  topBar: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(24,54,33,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229,228,198,0.28)',
  },
  settingsText: {
    fontSize: 18,
  },
  animatedWrap: {
    flex: 1,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    color: '#F4F0DE',
    fontWeight: '900',
    textAlign: 'center',
  },
  introLevel: {
    marginTop: 8,
    color: '#E9D89B',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  introText: {
    marginTop: 10,
    color: '#F4F0DE',
    fontWeight: '600',
    textAlign: 'center',
  },
  playWrap: {
    alignItems: 'center',
  },
  playTitle: {
    color: '#F4F0DE',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBarBg: {
    width: '100%',
    maxWidth: 360,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(28,48,35,0.72)',
    overflow: 'hidden',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(229,228,198,0.25)',
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#6AAE5B',
  },
  progressText: {
    color: '#F4F0DE',
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 12,
  },
  selectedWordWrap: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: 'rgba(24,54,33,0.76)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(229,228,198,0.24)',
  },
  selectedWordLabel: {
    color: '#E9D89B',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  selectedWordText: {
    color: '#F4F0DE',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  gridWrap: {
    borderRadius: 18,
    backgroundColor: 'rgba(16,35,24,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(229,228,198,0.24)',
    marginBottom: 14,
  },
  gridRow: {
    flexDirection: 'row',
  },
  blockCell: {
    backgroundColor: 'transparent',
  },
  activeCell: {
    backgroundColor: '#F6F0CF',
    borderWidth: 1,
    borderColor: '#A58E53',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wordCell: {
    backgroundColor: '#E8E0B6',
  },
  selectedCell: {
    backgroundColor: '#FFD66B',
    borderColor: '#6A4B00',
    borderWidth: 2,
  },
  cellNumber: {
    position: 'absolute',
    top: 1,
    left: 2,
    fontSize: 8,
    color: '#5C4A15',
    fontWeight: '800',
  },
  cellLetter: {
    color: '#1A1A1A',
    fontWeight: '900',
    textAlign: 'center',
  },
  inlineKeyboardWrap: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: 'rgba(24,54,33,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(229,228,198,0.24)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 14,
  },
  selectedBox: {
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  selectedBoxText: {
    color: '#F4F0DE',
    fontSize: 12,
    fontWeight: '800',
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  keyButton: {
    minWidth: 34,
    paddingHorizontal: 8,
    marginHorizontal: 3,
    borderRadius: 10,
    backgroundColor: '#F6F0CF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A58E53',
  },
  keyButtonWide: {
    minWidth: 66,
  },
  keyButtonBackspace: {
    minWidth: 46,
  },
  keyButtonText: {
    color: '#1A1A1A',
    fontWeight: '900',
  },
  cluesWrap: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: 'rgba(24,54,33,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(229,228,198,0.24)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  cluesTitle: {
    color: '#E9D89B',
    fontWeight: '900',
    marginBottom: 8,
  },
  clueButton: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 4,
  },
  clueButtonActive: {
    backgroundColor: 'rgba(255,214,107,0.18)',
  },
  clueText: {
    color: '#F4F0DE',
    fontWeight: '600',
  },
  clueTextActive: {
    color: '#FFD66B',
    fontWeight: '800',
  },
  mainButton: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: '#E9D89B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#C1AA66',
  },
  mainButtonText: {
    color: '#253321',
    fontWeight: '900',
  },
  secondaryButton: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: 'rgba(24,54,33,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(229,228,198,0.24)',
  },
  secondaryButtonText: {
    color: '#F4F0DE',
    fontWeight: '800',
  },
  resultLevel: {
    marginTop: 8,
    color: '#E9D89B',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  shareButton: {
    gap: 8,
  },
  shareIcon: {
    color: '#253321',
    fontSize: 16,
    fontWeight: '900',
    marginTop: -1,
  },
});