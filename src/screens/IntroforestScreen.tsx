import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ImageBackground,
  Animated,
  Easing,
  useWindowDimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Intro'>;

type OnboardingItem = {
  id: string;
  title: string;
  description: string;
  image: any;
  buttonText: string;
  imageStyle?: {
    width?: number;
    height?: number;
  };
};

const onboardingData: OnboardingItem[] = [
  {
    id: '1',
    title: 'Turn Tasks\nInto Progress',
    description:
      'Complete simple daily tasks and move through the day step by step. Leaves remain a quiet symbol of attention, growth, and the small moments that shape your path.',
    image: require('../assets/images/intro_cauldron_scene.png'),
    buttonText: 'Start',
    imageStyle: {
      width: 250,
      height: 250,
    },
  },
  {
    id: '2',
    title: 'Solve the\nCrossword',
    description:
      'Open the crossword screen and fill in words letter by letter. It is a calm space for focus, memory, and thoughtful pauses, where each solved clue feels like another leaf carried by the forest wind.',
    image: require('../assets/images/intro_gnome_lantern.png'),
    buttonText: 'Continue',
    imageStyle: {
      width: 280,
      height: 360,
    },
  },
  {
    id: '3',
    title: 'Take the\nQuiz',
    description:
      'Try the quiz and answer simple questions in a relaxed rhythm. It adds a playful moment to the journey and turns learning into something light, steady, and enjoyable.',
    image: require('../assets/images/intro_gnome_progress.png'),
    buttonText: 'Continue',
    imageStyle: {
      width: 290,
      height: 370,
    },
  },
  {
    id: '4',
    title: 'Read Forest\nStories',
    description:
      'Discover short stories filled with quiet thoughts, gentle scenes, and a warm forest mood. These pages are made for small pauses, reflection, and a softer pace during the day.',
    image: require('../assets/images/intro_growth_pot.png'),
    buttonText: 'Continue',
    imageStyle: {
      width: 250,
      height: 250,
    },
  },
  {
    id: '5',
    title: 'Save What\nMatters',
    description:
      'Keep your favorite stories close and return to them whenever you want. Saved pages become your own little collection of moments, like leaves gathered along a familiar woodland trail.',
    image: require('../assets/images/intro_book_guide.png'),
    buttonText: 'Get Started',
    imageStyle: {
      width: 310,
      height: 330,
    },
  },
];

export default function IntroScreen({ navigation }: Props) {
  const flatListRef = useRef<FlatList<OnboardingItem>>(null);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [activeIndex, setActiveIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(18)).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;

  const isVerySmall = height < 700;
  const isSmall = height >= 700 && height < 780;
  const isMedium = height >= 780 && height < 900;
  const isTabletLike = width >= 700;

  const topInset = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0);
  const bottomInset = Math.max(insets.bottom, 12);

  const sidePadding = isTabletLike ? 40 : isVerySmall ? 16 : isSmall ? 18 : 22;
  const cardMaxWidth = isTabletLike ? 430 : 380;
  const cardWidth = Math.min(width - sidePadding * 2, cardMaxWidth);

  const cardHeight = Math.min(
    height - topInset - bottomInset - (isVerySmall ? 54 : 68),
    isTabletLike ? 840 : 760
  );

  const titleFontSize = isTabletLike ? 30 : isVerySmall ? 20 : isSmall ? 22 : isMedium ? 24 : 26;
  const titleLineHeight = isTabletLike ? 36 : isVerySmall ? 24 : isSmall ? 27 : isMedium ? 30 : 32;

  const descFontSize = isTabletLike ? 17 : isVerySmall ? 13 : isSmall ? 14 : 15;
  const descLineHeight = isTabletLike ? 24 : isVerySmall ? 18 : isSmall ? 20 : 22;

  const titleMarginBottom = isVerySmall ? 10 : isSmall ? 12 : 16;
  const topContentPadding = isTabletLike ? 86 : isVerySmall ? 48 : isSmall ? 58 : isMedium ? 70 : 82;

  const imageAreaHeight = isTabletLike ? 340 : isVerySmall ? 170 : isSmall ? 210 : isMedium ? 245 : 285;
  const textAreaMinHeight = isTabletLike ? 260 : isVerySmall ? 170 : isSmall ? 190 : isMedium ? 215 : 235;

  const buttonHeight = isTabletLike ? 58 : isVerySmall ? 46 : isSmall ? 48 : 52;
  const buttonFontSize = isTabletLike ? 19 : isVerySmall ? 15 : isSmall ? 16 : 18;
  const buttonBottomSpacing = isTabletLike ? 22 : isVerySmall ? 12 : isSmall ? 14 : 18;
  const buttonWidth = Math.min(cardWidth * 0.88, isTabletLike ? 340 : 320);

  const paginationTop = topInset + (isVerySmall ? 8 : isSmall ? 10 : 14);
  const dotSize = isVerySmall ? 9 : 10;
  const activeDotWidth = isVerySmall ? 22 : 26;

  const getImageSize = (style?: { width?: number; height?: number }) => {
    const baseWidth = style?.width ?? 260;
    const baseHeight = style?.height ?? 260;

    const scale = isTabletLike ? 1.08 : isVerySmall ? 0.62 : isSmall ? 0.75 : isMedium ? 0.86 : 1;

    return {
      width: baseWidth * scale,
      height: baseHeight * scale,
    };
  };

  const runAppearAnimation = () => {
    fadeAnim.setValue(0);
    translateAnim.setValue(18);
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

  useEffect(() => {
    runAppearAnimation();
  }, []);

  const handleNext = () => {
    if (activeIndex < onboardingData.length - 1) {
      const nextIndex = activeIndex + 1;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setActiveIndex(nextIndex);

      requestAnimationFrame(() => {
        runAppearAnimation();
      });
    } else {
      navigation.replace('MainTabs');
    }
  };

  const renderItem = ({ item }: { item: OnboardingItem }) => {
    const imageSize = getImageSize(item.imageStyle);

    return (
      <View style={[styles.page, { width }]}>
        <Animated.View
          style={[
            styles.contentBox,
            {
              width: cardWidth,
              minHeight: cardHeight,
              paddingTop: topContentPadding,
              paddingHorizontal: sidePadding,
              paddingBottom: buttonBottomSpacing,
              opacity: fadeAnim,
              transform: [{ translateY: translateAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.textArea, { minHeight: textAreaMinHeight }]}>
            <Text
              style={[
                styles.title,
                {
                  fontSize: titleFontSize,
                  lineHeight: titleLineHeight,
                  marginBottom: titleMarginBottom,
                },
              ]}
            >
              {item.title}
            </Text>

            <Text
              style={[
                styles.description,
                {
                  fontSize: descFontSize,
                  lineHeight: descLineHeight,
                },
              ]}
            >
              {item.description}
            </Text>
          </View>

          <View style={[styles.imageArea, { minHeight: imageAreaHeight }]}>
            <Image
              source={item.image}
              style={{
                width: imageSize.width,
                height: imageSize.height,
              }}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              {
                width: buttonWidth,
                height: buttonHeight,
                borderRadius: buttonHeight / 2,
              },
            ]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  fontSize: buttonFontSize,
                },
              ]}
            >
              {item.buttonText}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('../assets/images/loading_for_background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.darkOverlay}>
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          extraData={activeIndex}
        />

        <View style={[styles.pagination, { top: paginationTop }]}>
          {onboardingData.map((_, index) => {
            const active = index === activeIndex;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: active ? activeDotWidth : dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                  },
                  active && styles.activeDot,
                ]}
              />
            );
          })}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.34)',
    justifyContent: 'center',
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentBox: {
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  textArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontWeight: '900',
    color: '#E7F22E',
    textAlign: 'center',
  },
  description: {
    fontWeight: '500',
    color: 'rgba(210, 224, 66, 0.92)',
    textAlign: 'center',
    width: '100%',
  },
  imageArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  button: {
    backgroundColor: '#4D7E37',
    borderWidth: 1.2,
    borderColor: 'rgba(188, 226, 107, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#F5F5F5',
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  pagination: {
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  activeDot: {
    backgroundColor: '#D8EE3B',
  },
});