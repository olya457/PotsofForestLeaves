import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { forestStories } from '../data/stories';

const SAVED_STORIES_KEY = 'forest_saved_story_ids';

export default function SavedScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const isSmall = height < 780;
  const isVerySmall = height < 700;

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  useEffect(() => {
    loadSavedStories();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setSelectedStoryId(null);
      loadSavedStories();
    }, [])
  );

  const loadSavedStories = async () => {
    try {
      const raw = await AsyncStorage.getItem(SAVED_STORIES_KEY);
      if (!raw) {
        setSavedIds([]);
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSavedIds(parsed);
      } else {
        setSavedIds([]);
      }
    } catch {
      setSavedIds([]);
    }
  };

  const persistSavedStories = async (nextIds: string[]) => {
    try {
      await AsyncStorage.setItem(SAVED_STORIES_KEY, JSON.stringify(nextIds));
    } catch {}
  };

  const savedStories = useMemo(
    () => forestStories.filter(story => savedIds.includes(story.id)),
    [savedIds]
  );

  const selectedStory = useMemo(
    () => savedStories.find(item => item.id === selectedStoryId) ?? null,
    [savedStories, selectedStoryId]
  );

  const isEmptyState = !selectedStory && savedStories.length === 0;

  const handleShare = async () => {
    if (!selectedStory) return;

    try {
      await Share.share({
        message: `${selectedStory.title}\n\n${selectedStory.content}`,
      });
    } catch {}
  };

  const removeSaved = async () => {
    if (!selectedStory) return;

    const nextIds = savedIds.filter(id => id !== selectedStory.id);
    setSavedIds(nextIds);
    await persistSavedStories(nextIds);
    setSelectedStoryId(null);
  };

  return (
    <ImageBackground
      source={require('../assets/images/loading_for_background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + (isVerySmall ? 6 : 8) + (isEmptyState ? 10 : 0),
            paddingHorizontal: isVerySmall ? 12 : 18,
          },
        ]}
      >
        <View
          style={[
            styles.headerRow,
            {
              marginBottom: isVerySmall ? 10 : 16,
            },
          ]}
        >
          <View style={styles.headerSide} />

          <View style={styles.headerTitleWrap}>
            <Text
              style={[
                styles.headerTitle,
                {
                  fontSize: isVerySmall ? 19 : isSmall ? 22 : 24,
                },
              ]}
            >
              Saved
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.settingsButton,
              {
                width: isVerySmall ? 38 : 44,
                height: isVerySmall ? 38 : 44,
                borderRadius: isVerySmall ? 19 : 22,
              },
            ]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text
              style={[
                styles.settingsText,
                { fontSize: isVerySmall ? 16 : 18 },
              ]}
            >
              ⚙️
            </Text>
          </TouchableOpacity>
        </View>

        {!selectedStory ? (
          savedStories.length === 0 ? (
            <View
              style={[
                styles.emptyWrap,
                {
                  paddingTop: (isVerySmall ? 6 : 10) + 10,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyText,
                  {
                    fontSize: isVerySmall ? 11.5 : isSmall ? 13 : 14,
                    lineHeight: isVerySmall ? 16 : isSmall ? 18 : 20,
                    maxWidth: isVerySmall ? 210 : 250,
                    marginTop: isVerySmall ? 4 : 8,
                  },
                ]}
              >
                You don't have any saved stories yet. You can find what to save in the stories tab.
              </Text>

              <Image
                source={require('../assets/images/intro_book_guide.png')}
                style={{
                  width: isVerySmall ? 180 : isSmall ? 220 : 250,
                  height: isVerySmall ? 250 : isSmall ? 310 : 350,
                  marginTop: (isVerySmall ? 8 : 18) + 40,
                }}
                resizeMode="contain"
              />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingTop: 4,
                paddingBottom: Math.max(insets.bottom + 110, 140),
              }}
            >
              {savedStories.map(story => (
                <TouchableOpacity
                  key={story.id}
                  style={[
                    styles.storyButton,
                    {
                      height: isVerySmall ? 42 : isSmall ? 46 : 52,
                      borderRadius: isVerySmall ? 16 : 18,
                      marginBottom: isVerySmall ? 8 : 12,
                    },
                  ]}
                  activeOpacity={0.88}
                  onPress={() => setSelectedStoryId(story.id)}
                >
                  <Text
                    style={[
                      styles.storyButtonText,
                      {
                        fontSize: isVerySmall ? 10.5 : isSmall ? 12 : 13,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {story.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 4,
              paddingBottom: Math.max(insets.bottom + 120, 150),
            }}
          >
            <View
              style={[
                styles.storyCard,
                {
                  borderRadius: isVerySmall ? 18 : 26,
                  paddingHorizontal: isVerySmall ? 12 : 18,
                  paddingTop: isVerySmall ? 12 : 18,
                  paddingBottom: isVerySmall ? 14 : 18,
                },
              ]}
            >
              <Text
                style={[
                  styles.storyTitle,
                  {
                    fontSize: isVerySmall ? 13 : isSmall ? 15 : 16,
                    marginBottom: isVerySmall ? 8 : 12,
                  },
                ]}
              >
                {selectedStory.title}
              </Text>

              <Text
                style={[
                  styles.storyText,
                  {
                    fontSize: isVerySmall ? 8.8 : isSmall ? 9.8 : 10.5,
                    lineHeight: isVerySmall ? 12 : isSmall ? 14 : 15,
                  },
                ]}
              >
                {selectedStory.content}
              </Text>
            </View>

            <View style={[styles.actionsRow, { marginTop: isVerySmall ? 10 : 14 }]}>
              <TouchableOpacity
                style={[
                  styles.shareButton,
                  {
                    height: isVerySmall ? 38 : 44,
                    borderRadius: isVerySmall ? 18 : 22,
                  },
                ]}
                activeOpacity={0.85}
                onPress={handleShare}
              >
                <Text
                  style={[
                    styles.shareButtonText,
                    {
                      fontSize: isVerySmall ? 11.5 : 14,
                    },
                  ]}
                >
                  Share
                </Text>
                <Text
                  style={[
                    styles.shareIcon,
                    { fontSize: isVerySmall ? 14 : 16 },
                  ]}
                >
                  ↗
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.removeButton,
                  {
                    width: isVerySmall ? 38 : 44,
                    height: isVerySmall ? 38 : 44,
                    borderRadius: isVerySmall ? 18 : 22,
                  },
                ]}
                activeOpacity={0.85}
                onPress={removeSaved}
              >
                <Text
                  style={[
                    styles.removeIcon,
                    { fontSize: isVerySmall ? 16 : 18 },
                  ]}
                >
                  🔖
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.backButton,
                {
                  height: isVerySmall ? 38 : 44,
                  borderRadius: isVerySmall ? 18 : 22,
                  marginTop: isVerySmall ? 10 : 12,
                },
              ]}
              activeOpacity={0.85}
              onPress={() => setSelectedStoryId(null)}
            >
              <Text
                style={[
                  styles.backButtonText,
                  {
                    fontSize: isVerySmall ? 11.5 : 14,
                  },
                ]}
              >
                Back to saved
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
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
    backgroundColor: 'rgba(0,0,0,0.24)',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSide: {
    width: 44,
    height: 44,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF8EB',
    fontWeight: '900',
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: '#6B3E1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 224, 169, 0.28)',
  },
  settingsText: {
    fontWeight: '700',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  emptyText: {
    color: '#D8EE3B',
    textAlign: 'center',
    fontWeight: '500',
  },
  storyButton: {
    width: '100%',
    backgroundColor: 'rgba(109, 58, 24, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 120, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  storyButtonText: {
    color: '#F7F2E7',
    fontWeight: '500',
    textAlign: 'center',
  },
  storyCard: {
    width: '100%',
    backgroundColor: 'rgba(109, 58, 24, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 120, 0.18)',
  },
  storyTitle: {
    color: '#FFF8EB',
    fontWeight: '800',
    textAlign: 'center',
  },
  storyText: {
    color: '#F5EBDD',
    textAlign: 'center',
    fontWeight: '400',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#4B7A39',
    borderWidth: 1,
    borderColor: 'rgba(188, 226, 107, 0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareButtonText: {
    color: '#F5F7F0',
    fontWeight: '800',
  },
  shareIcon: {
    color: '#F5F7F0',
    fontWeight: '800',
  },
  removeButton: {
    backgroundColor: '#4B7A39',
    borderWidth: 1,
    borderColor: 'rgba(188, 226, 107, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {},
  backButton: {
    width: '100%',
    backgroundColor: 'rgba(109, 58, 24, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 120, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFF8EB',
    fontWeight: '700',
  },
});