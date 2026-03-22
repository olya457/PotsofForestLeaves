import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const isSmall = height < 780;
  const isVerySmall = height < 700;

  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const screenOpacity = useRef(new Animated.Value(0)).current;
  const screenTranslate = useRef(new Animated.Value(18)).current;

  const block1Opacity = useRef(new Animated.Value(0)).current;
  const block1Translate = useRef(new Animated.Value(18)).current;

  const block2Opacity = useRef(new Animated.Value(0)).current;
  const block2Translate = useRef(new Animated.Value(18)).current;

  const block3Opacity = useRef(new Animated.Value(0)).current;
  const block3Translate = useRef(new Animated.Value(18)).current;

  const aboutOpacity = useRef(new Animated.Value(0)).current;
  const aboutTranslate = useRef(new Animated.Value(20)).current;
  const aboutImageScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(screenTranslate, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [screenOpacity, screenTranslate]);

  useEffect(() => {
    if (!showAbout) {
      block1Opacity.setValue(0);
      block1Translate.setValue(18);
      block2Opacity.setValue(0);
      block2Translate.setValue(18);
      block3Opacity.setValue(0);
      block3Translate.setValue(18);

      Animated.stagger(110, [
        Animated.parallel([
          Animated.timing(block1Opacity, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(block1Translate, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(block2Opacity, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(block2Translate, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(block3Opacity, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(block3Translate, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      aboutOpacity.setValue(0);
      aboutTranslate.setValue(20);
      aboutImageScale.setValue(0.92);

      Animated.parallel([
        Animated.timing(aboutOpacity, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(aboutTranslate, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(aboutImageScale, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [
    showAbout,
    block1Opacity,
    block1Translate,
    block2Opacity,
    block2Translate,
    block3Opacity,
    block3Translate,
    aboutOpacity,
    aboutTranslate,
    aboutImageScale,
  ]);

  const handleShareApp = async () => {
    try {
      await Share.share({
        message:
          'Pots of Forest Leaves helps you stay productive through small daily progress. Complete tasks, collect leaves, read stories, and explore quizzes in a calm forest atmosphere.',
      });
    } catch {}
  };

  return (
    <ImageBackground
      source={require('../assets/images/loading_for_background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: insets.top + (isVerySmall ? 8 : 14),
            paddingHorizontal: isVerySmall ? 12 : isSmall ? 16 : 18,
            paddingBottom: Math.max(insets.bottom + 14, 18),
            opacity: screenOpacity,
            transform: [{ translateY: screenTranslate }],
          },
        ]}
      >
        {!showAbout ? (
          <View style={styles.flexFill}>
            <View style={{ marginTop: isVerySmall ? 22 : 34 }} />

            <Animated.View
              style={{
                opacity: block1Opacity,
                transform: [{ translateY: block1Translate }],
              }}
            >
              <View style={styles.row}>
                <Text
                  style={[
                    styles.rowLabel,
                    { fontSize: isVerySmall ? 14 : isSmall ? 16 : 17 },
                  ]}
                >
                  Vibration
                </Text>

                <Switch
                  value={vibrationEnabled}
                  onValueChange={setVibrationEnabled}
                  trackColor={{
                    false: 'rgba(255,255,255,0.18)',
                    true: '#4AE36D',
                  }}
                  thumbColor="#F4F4F4"
                  ios_backgroundColor="rgba(255,255,255,0.18)"
                />
              </View>

              <View style={styles.separator} />

              <View
                style={[
                  styles.row,
                  { marginTop: isVerySmall ? 10 : 12 },
                ]}
              >
                <Text
                  style={[
                    styles.rowLabel,
                    { fontSize: isVerySmall ? 14 : isSmall ? 16 : 17 },
                  ]}
                >
                  Notification
                </Text>

                <Switch
                  value={notificationEnabled}
                  onValueChange={setNotificationEnabled}
                  trackColor={{
                    false: 'rgba(255,255,255,0.18)',
                    true: '#4AE36D',
                  }}
                  thumbColor="#F4F4F4"
                  ios_backgroundColor="rgba(255,255,255,0.18)"
                />
              </View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: block2Opacity,
                transform: [{ translateY: block2Translate }],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.mainButton,
                  {
                    height: isVerySmall ? 42 : 48,
                    borderRadius: isVerySmall ? 16 : 22,
                    marginTop: isVerySmall ? 28 : 38,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => setShowAbout(true)}
              >
                <Text
                  style={[
                    styles.mainButtonText,
                    { fontSize: isVerySmall ? 12.5 : 15 },
                  ]}
                >
                  About the App
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.mainButton,
                  {
                    height: isVerySmall ? 42 : 48,
                    borderRadius: isVerySmall ? 16 : 22,
                    marginTop: 12,
                  },
                ]}
                activeOpacity={0.85}
                onPress={handleShareApp}
              >
                <Text
                  style={[
                    styles.mainButtonText,
                    { fontSize: isVerySmall ? 12.5 : 15 },
                  ]}
                >
                  Share the app
                </Text>
                <Text
                  style={[
                    styles.shareIcon,
                    { fontSize: isVerySmall ? 13 : 16 },
                  ]}
                >
                  ↗
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={[
                styles.bottomBackWrap,
                {
                  marginBottom: Platform.OS === 'android' ? 40 : 0,
                  opacity: block3Opacity,
                  transform: [{ translateY: block3Translate }],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.bottomBackButton,
                  {
                    height: isVerySmall ? 42 : 46,
                    borderRadius: isVerySmall ? 16 : 22,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => navigation.goBack()}
              >
                <Text
                  style={[
                    styles.bottomBackText,
                    { fontSize: isVerySmall ? 12.5 : 15 },
                  ]}
                >
                  Back
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          <Animated.View
            style={{
              flex: 1,
              opacity: aboutOpacity,
              transform: [{ translateY: aboutTranslate }],
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: Math.max(insets.bottom + 16, 24),
              }}
            >
              <TouchableOpacity
                style={[
                  styles.mainButton,
                  {
                    height: isVerySmall ? 42 : 48,
                    borderRadius: isVerySmall ? 16 : 22,
                    marginTop: isVerySmall ? 2 : 8,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => setShowAbout(false)}
              >
                <Text
                  style={[
                    styles.mainButtonText,
                    { fontSize: isVerySmall ? 12.5 : 15 },
                  ]}
                >
                  Back
                </Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.aboutCard,
                  {
                    borderRadius: isVerySmall ? 20 : 28,
                    paddingHorizontal: isVerySmall ? 12 : isSmall ? 16 : 18,
                    paddingTop: isVerySmall ? 12 : 18,
                    paddingBottom: isVerySmall ? 14 : 18,
                    marginTop: isVerySmall ? 12 : 18,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.aboutText,
                    {
                      fontSize: isVerySmall ? 10.5 : isSmall ? 11 : 11.5,
                      lineHeight: isVerySmall ? 14 : isSmall ? 15 : 15.5,
                    },
                  ]}
                >
                  This app is designed to support calm daily progress through small steps and thoughtful routines.
{'\n\n'}
Create your own tasks or complete simple suggested ones, moving through the day at a steady and comfortable pace.
Leaves remain here as a gentle symbol of attention, growth, and the little moments that shape your path.
{'\n\n'}
You can also open the crossword screen and solve clues letter by letter in a quiet, focused rhythm.
It adds a soft word-based activity that invites memory, concentration, and gentle pauses.
{'\n\n'}
The app also includes a quiz section with simple questions, along with short forest stories made for calm reading and reflection.
If a story feels meaningful, you can save it and return to it later in your personal saved collection.
{'\n\n'}
Sometimes the smallest steps, the quietest thoughts, and the simplest moments are the ones that stay with us the longest.
                </Text>
              </View>

              <Animated.Image
                source={require('../assets/images/intro_gnome_progress.png')}
                style={{
                  width: isVerySmall ? 128 : isSmall ? 164 : 210,
                  height: isVerySmall ? 158 : isSmall ? 206 : 260,
                  alignSelf: 'center',
                  marginTop: isVerySmall ? 10 : 14,
                  transform: [{ scale: aboutImageScale }],
                }}
                resizeMode="contain"
              />

              <TouchableOpacity
                style={[
                  styles.mainButton,
                  {
                    height: isVerySmall ? 42 : 48,
                    borderRadius: isVerySmall ? 16 : 22,
                    marginTop: isVerySmall ? 10 : 12,
                  },
                ]}
                activeOpacity={0.85}
                onPress={handleShareApp}
              >
                <Text
                  style={[
                    styles.mainButtonText,
                    { fontSize: isVerySmall ? 12.5 : 15 },
                  ]}
                >
                  Share the app
                </Text>
                <Text
                  style={[
                    styles.shareIcon,
                    { fontSize: isVerySmall ? 13 : 16 },
                  ]}
                >
                  ↗
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        )}
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  content: {
    flex: 1,
  },
  flexFill: {
    flex: 1,
  },
  row: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    color: '#FFFFFF',
    fontWeight: '500',
    flexShrink: 1,
    paddingRight: 10,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  mainButton: {
    width: '100%',
    backgroundColor: '#4B7A39',
    borderWidth: 1,
    borderColor: 'rgba(188, 226, 107, 0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  mainButtonText: {
    color: '#F5F7F0',
    fontWeight: '800',
    textAlign: 'center',
  },
  shareIcon: {
    color: '#F5F7F0',
    fontWeight: '800',
  },
  aboutCard: {
    width: '100%',
    backgroundColor: 'rgba(109, 58, 24, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 120, 0.18)',
  },
  aboutText: {
    color: '#F5EBDD',
    textAlign: 'center',
    fontWeight: '400',
  },
  bottomBackWrap: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  bottomBackButton: {
    width: '100%',
    backgroundColor: 'rgba(109, 58, 24, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 120, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  bottomBackText: {
    color: '#FFF8EB',
    fontWeight: '700',
  },
});