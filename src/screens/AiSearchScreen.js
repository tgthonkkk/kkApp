import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OpenAI from 'openai';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../api/firebase';
import { getAuth } from 'firebase/auth';

const CATEGORY_DATA = {
    '서적': ['공학/자연', '미술/건축', '음악/체육', '의학/보건', '인문/상경', '사범/교육', '기타'],
    '전공 물품': ['공학/자연', '미술/건축', '음악/체육', '의학/보건', '인문/상경', '사범/교육', '기타'],
    '기타': ['생활용품', '의류','굿즈', '기타']
};

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_API_URL,
  dangerouslyAllowBrowser: true, 
});

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const checkAuthAndNavigate = (action) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
        action();
    } else {
        navigation.navigate("Login");
    }
  };

  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const q = query(collection(db, 'posts'), limit(30));
      const querySnapshot = await getDocs(q);
      
      const posts = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({ 
          id: doc.id, 
          title: data.title || '제목 없음',
          mainCategory: data.mainCategory || '기타',
          subCategory: data.subCategory || '기타',
          content: data.content || ''
        });
      });

      if (posts.length === 0) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      const prompt = `
        사용자가 다음과 같이 검색했습니다: "${searchQuery}"
        
        앱 내 카테고리 구조는 다음과 같습니다:
        ${JSON.stringify(CATEGORY_DATA)}

        아래의 게시물 목록 중에서 **오직 '제목(title)'과 '카테고리와 content'**를 기준으로 사용자의 검색어와 직접적으로 관련이 있는 게시물의 id들만 순수 JSON 배열 형태로(예: ["id1", "id2"]) 최대 10개까지만 골라주세요. 제목, content와 연관성이 낮거나 애매한 것은 과감히 제외하세요.
        주의: 마크다운 기호(백틱 등)나 다른 설명글은 절대 포함하지 말고, 오직 대괄호 [ 로 시작해서 대괄호 ] 로 끝나는 JSON 배열 문자열만 정확히 출력하세요. 연관된 것이 없다면 [] 를 출력하세요.
        
        게시물 목록:
        ${JSON.stringify(posts)}
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });

      const rawContent = response.choices[0].message.content;
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      const matchedIds = JSON.parse(jsonMatch[0]);

      const allQuerySnapshot = await getDocs(query(collection(db, 'posts'), limit(30)));
      const fullPosts = [];
      allQuerySnapshot.forEach((doc) => {
        fullPosts.push({ id: doc.id, ...doc.data() });
      });

      const filteredPosts = fullPosts.filter(post => matchedIds.includes(post.id));
      setSearchResults(filteredPosts);

    } catch (error) {
      console.error("AI 검색 실패:", error);
      alert("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const renderSearchResultItem = ({ item }) => {
    if (!item) return null;

    const hasImage = item.imageUrls && item.imageUrls.length > 0;
    const imageSource = hasImage
        ? { uri: item.imageUrls[0] } 
        : { uri: 'https://dummyimage.com/150x150/cccccc/ffffff.png&text=No+Image' };

    const rawPrice = Number(item?.price) || 0;
    const formattedPrice = `${rawPrice.toLocaleString()}원`;
    
    return (
        <TouchableOpacity 
            style={styles.itemContainer} 
            activeOpacity={0.7}
            onPress={() => checkAuthAndNavigate(() => navigation.navigate("Detail", { item: item }))}
        >
            <Image 
                source={imageSource} 
                style={styles.itemImage}
                resizeMode="cover"
            />
            <Text style={styles.itemCategoryText}>
              {item.mainCategory} &gt; {item.subCategory}
            </Text>
            <Text numberOfLines={2} ellipsizeMode='tail' style={styles.itemTitle}>
                {item.title || '제목 없음'}
            </Text>
            <Text style={styles.itemPrice}>
                {formattedPrice}
            </Text>
        </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.input}
          placeholder="어떤 물건이나 글을 찾으시나요?"
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleAISearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleAISearch}>
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>AI가 관련 게시물을 분석하고 있어요...</Text>
        </View>
      )}

      {!loading && (
        <FlatList
          data={searchResults}
          keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
          renderItem={renderSearchResultItem}
          numColumns={2}
          columnWrapperStyle={searchResults.length > 0 ? styles.columnWrapper : null}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
            </View>
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E4E8',
  },
  backButton: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F1F3F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333',
  },
  searchButton: {
    marginLeft: 8,
    backgroundColor: '#111111',
    height: 40,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContainer: {
    padding: 15,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  centerContainer: {
    marginTop: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#555',
    fontSize: 15,
    marginTop: 10,
    fontWeight: '600',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  itemContainer: {
    width: '48%',
    marginBottom: 20,
  },
  itemImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    backgroundColor: '#f1f3f5'
  },
  itemCategoryText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 4,
    color: '#333'
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    color: '#000'
  },
});