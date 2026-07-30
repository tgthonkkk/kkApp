import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { initialSellingProducts } from '../data/mockSellingData';
import { db, auth } from '../api/firebase'; 
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const Status = {
  SELLING: { text: '판매중', bgColor: '#e6fcf5', textColor: '#0ca678' },
  RESERVED: { text: '예약중', bgColor: '#fff4e6', textColor: '#f59f00' },
  SOLD_OUT: { text: '판매완료', bgColor: '#f1f3f5', textColor: '#868e96' }
};

export default function SellinglistScreen() {
  const navigation = useNavigation();

  const [products, setProducts] = useState([]);
  const {showActionSheetWithOptions} = useActionSheet();

  const fetchMySellingProducts = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const q = query(
        collection(db, "posts"), 
        where("authorUid", "==", currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const fetchedProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setProducts(fetchedProducts);
    } catch (error) {
      console.error("판매 내역 불러오기 실패:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMySellingProducts();
    }, [])
  );

  const deleteProduct = (productId) => {
    Alert.alert("상품 삭제", "정말 이 상품을 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "posts", productId));
              setProducts(prev => prev.filter(p => p.id !== productId));
              
              Alert.alert("알림", "상품이 삭제되었습니다.");
            } catch (error) {
              console.error("상품 삭제 실패:", error);
              Alert.alert("오류", "상품 삭제에 실패했습니다.");
            }
          }
        }
      ]
    );
  };

  const editProduct = (product) => {
    navigation.navigate('AddScreen', { productData: product });
  };

  const changeStatus = (productId) => {
    const options = ['판매중', '예약중', '판매완료', '취소'];
    const cancelButtonIndex=3;
    
    showActionSheetWithOptions(
      {options, cancelButtonIndex, title: '상품 상태 변경'},
      async (selectedIndex) => {
        let newStatus = null;
        switch (selectedIndex) {
          case 0: newStatus = 'SELLING'; break;
          case 1: newStatus = 'RESERVED'; break;
          case 2: newStatus = 'SOLD_OUT'; break;
          default: return;
        }

        if (newStatus) {
          try {
            const productRef = doc(db, "posts", productId);
            await updateDoc(productRef, { status: newStatus });

            setProducts(prev => prev.map(p => p.id === productId ? {...p, status: newStatus } : p));
          } catch (error) {
            console.error("상태 변경 실패:", error);
            Alert.alert("오류", "상품 상태 변경에 실패했습니다.");
          }
        }
      }
    );
  };

  const renderItem = ({item}) => {
    const currentStatus = Status[item.status] || Status.SELLING;
    return (
      <View style={styles.card}>
        <View style={styles.firstRow}>
          <Image source={{ uri: item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : 'https://via.placeholder.com/70' }} style={styles.image}/>
          
          <View style={styles.infoContainer}>
            <View style={[styles.badgeContainer, { backgroundColor: currentStatus.bgColor}]}>
              <Text style={[styles.badgeText, { color: currentStatus.textColor }]}>{currentStatus.text}</Text>
            </View>

            <Text style={styles.titleText} numberOfLines={1}>
              {item.title}
            </Text>

            <Text style={styles.priceText}>
              {item.price.toLocaleString()}원
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => deleteProduct(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash" size={20} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={styles.separator} />

        <View style={styles.secondRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => editProduct(item)}
            >
              <Ionicons name="create-outline" size={17} color="#555" style={styles.actionIcon} />
              <Text style={styles.actionButtonText}>수정</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>판매 내역</Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },

  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center'
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111'
  },

  listContent: {
    padding: 16
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16
  },

  firstRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#eee'
  },

  infoContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },

  badgeContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 4
  },

  badgeText: {
    fontSize: 13,
    fontWeight: 'bold'
  },

  titleText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#333',
    marginBottom: 6,
    lineHeight: 20
  },

  priceText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111'
  },

  deleteButton: {
    padding: 5,
    alignSelf: 'flex-start'
  },

  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 14
  },

  secondRow: {
    flexDirection: 'row',
    gap: 10
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    backgroundColor: '#fdfdfd'
  },

  actionIcon: {
    marginRight: 6
  },

  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#444'
  }
});