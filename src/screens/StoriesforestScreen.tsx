import React, { useEffect, useMemo, useState } from 'react';
import {
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

export default function StoriesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const isSmall = height < 780;
  const isVerySmall = height < 700;

  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const selectedStory = useMemo(
    () => forestStories.find(item => item.id === selectedStoryId) ?? null,
    [selectedStoryId]
  );

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

  const handleShare = async () => {
    if (!selectedStory) return;

    try {
      await Share.share({
        message: `${selectedStory.title}\n\n${selectedStory.content}`,
      });
    } catch {}
  };

  const toggleSave = async () => {
    if (!selectedStory) return;

    const nextIds = savedIds.includes(selectedStory.id)
      ? savedIds.filter(id => id !== selectedStory.id)
      : [...savedIds, selectedStory.id];

    setSavedIds(nextIds);
    await persistSavedStories(nextIds);
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
            paddingTop: insets.top + 8,
            paddingHorizontal: isVerySmall ? 14 : 18,
          },
        ]}
      >
        <View
          style={[
            styles.headerRow,
            {
              marginBottom: isVerySmall ? 12 : 16,
            },
          ]}
        >
          <View style={styles.headerSide} />

          <View style={styles.headerTitleWrap}>
            <Text
              style={[
                styles.headerTitle,
                {
                  fontSize: isVerySmall ? 20 : 24,
                },
              ]}
            >
              Stories
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.settingsButton,
              {
                width: isVerySmall ? 40 : 44,
                height: isVerySmall ? 40 : 44,
                borderRadius: isVerySmall ? 20 : 22,
              },
            ]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.settingsText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {!selectedStory ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 4,
              paddingBottom: Math.max(insets.bottom + 110, 140),
            }}
          >
            {forestStories.map(story => (
              <TouchableOpacity
                key={story.id}
                style={[
                  styles.storyButton,
                  {
                    height: isVerySmall ? 50 : isSmall ? 54 : 58,
                    borderRadius: isVerySmall ? 18 : 20,
                    marginBottom: isVerySmall ? 10 : 14,
                  },
                ]}
                activeOpacity={0.88}
                onPress={() => setSelectedStoryId(story.id)}
              >
                <Text
                  style={[
                    styles.storyButtonText,
                    {
                      fontSize: isVerySmall ? 13 : 15,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {story.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
                  borderRadius: isVerySmall ? 22 : 28,
                  paddingHorizontal: isVerySmall ? 16 : 20,
                  paddingTop: isVerySmall ? 16 : 18,
                  paddingBottom: isVerySmall ? 18 : 20,
                },
              ]}
            >
              <Text
                style={[
                  styles.storyTitle,
                  {
                    fontSize: isVerySmall ? 16 : 18,
                    marginBottom: isVerySmall ? 10 : 14,
                  },
                ]}
              >
                {selectedStory.title}
              </Text>

              <Text
                style={[
                  styles.storyText,
                  {
                    fontSize: isVerySmall ? 11 : 12,
                    lineHeight: isVerySmall ? 16 : 18,
                  },
                ]}
              >
                {selectedStory.content}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[
                  styles.shareButton,
                  {
                    height: isVerySmall ? 42 : 46,
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
                      fontSize: isVerySmall ? 13 : 15,
                    },
                  ]}
                >
                  Share
                </Text>
                <Text style={styles.shareIcon}>↗</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    width: isVerySmall ? 42 : 46,
                    height: isVerySmall ? 42 : 46,
                    borderRadius: isVerySmall ? 18 : 22,
                  },
                ]}
                activeOpacity={0.85}
                onPress={toggleSave}
              >
                <Text style={styles.saveIcon}>
                  {savedIds.includes(selectedStory.id) ? '🔖' : '📑'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.backButton,
                {
                  height: isVerySmall ? 42 : 46,
                  borderRadius: isVerySmall ? 18 : 22,
                },
              ]}
              activeOpacity={0.85}
              onPress={() => setSelectedStoryId(null)}
            >
              <Text
                style={[
                  styles.backButtonText,
                  {
                    fontSize: isVerySmall ? 13 : 15,
                  },
                ]}
              >
                Back to stories
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
    fontSize: 18,
  },
  storyButton: {
    width: '100%',
    backgroundColor: 'rgba(109, 58, 24, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 120, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
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
    marginTop: 14,
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
    fontSize: 16,
    fontWeight: '800',
  },
  saveButton: {
    backgroundColor: '#4B7A39',
    borderWidth: 1,
    borderColor: 'rgba(188, 226, 107, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveIcon: {
    fontSize: 18,
  },
  backButton: {
    width: '100%',
    marginTop: 12,
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