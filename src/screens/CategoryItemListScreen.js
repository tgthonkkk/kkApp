import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { db } from '../api/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function CategoryItemListScreen({route, navigation}) {
    const {mainCategory, subCategory} = route.params;

    const [filterType, setFilterType] = useState('ALL');
    const [products, setProducts] = useState([]);

    useEffect(() => {
        navigation.setOptions({
            title: `${mainCategory} > ${subCategory}`,
        });

        fetchProducts();

    }, [mainCategory, subCategory]);


    const fetchProducts = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "posts"));

            const postList = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));

            setProducts(postList);

        } catch(error) {
            console.error("게시물 불러오기 실패:", error);
        }
    };
    const filteredProducts = products.filter((item) => {
        const matchCategory = item.mainCategory === mainCategory && item.subCategory === subCategory;
        const matchType = filterType === 'ALL' || item.type ===filterType;
        return matchCategory &&matchType
    });

    const renderItem = ({item}) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('Detail', { item })}
        >
            {/* <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#a0a0a0" />
            </View> */}

            {
            item.imageUrls && item.imageUrls.length > 0 ? (
                <Image
                    source={{uri:item.imageUrls[0]}}
                    style={styles.imagePlaceholder}
                />
            )
            :
            (
                <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={40} color="#a0a0a0" />
                </View>
            )
            }
            
            <View style={styles.cardInfo}>
                <View style={styles.badgeContainer}>
                    <Text style={[styles.badge, item.type === 'RENT' ? styles.rentBadge : styles.sellBadge]}>
                        {item.type === 'RENT' ? '대여' : '판매'}
                    </Text>
                </View>
                <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.price}>{item.price.toLocaleString()}원 {item.type === 'RENT'}</Text>
                <Text style={styles.location}>{item.location}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tabButton, filterType === 'ALL' && styles.activeTab]}
                    onPress={() => setFilterType('ALL')}
                >
                    <Text style={[styles.tabText, filterType === 'ALL' && styles.activeTabText]}>전체</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabButton, filterType === 'RENT' && styles.activeTab]}
                    onPress={() => setFilterType('RENT')}
                >
                    <Text style={[styles.tabText, filterType === 'RENT' && styles.activeTabText]}>대여</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabButton, filterType === 'SELL' && styles.activeTab]}
                    onPress={() => setFilterType('SELL')}
                >
                    <Text style={[styles.tabText, filterType === 'SELL' && styles.activeTabText]}>판매</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cube-outline" size={56} color="#c7c7cc" style={styles.emptyIcon} />
                        <Text style={styles.emptyText}>해당하는 상품이 없습니다.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff'
    },

    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingHorizontal: 15,
        backgroundColor: '#fff'
    },

    tabButton: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginRight: 8
    },

    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: '#000000'
    },
    
    tabText: {
        fontSize: 17,
        color: '#8e8e93',
        fontWeight: '500'
    },

    activeTabText: {
        color: '#000000',
        fontWeight: 'bold'
    },

    listContainer: {
        padding: 15
    },

    card: {
        flexDirection: 'row',
        marginBottom: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'flex-start'
    },

    imagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#f2f2f7',
        justifyContent: 'center',
        alignItems: 'center'
    },

    cardInfo: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'flex-start'
    },

    badgeContainer: {
        flexDirection: 'row',
        marginBottom: 8
    },

    badge: {
        fontSize: 13,
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
        overflow: 'hidden'
    },

    rentBadge: {
        backgroundColor: '#e1f5fe',
        color: '#0288d1'
    },

    sellBadge: {
        backgroundColor: '#e8f5e9',
        color: '#388e3c'
    },

    productTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1c1c1e',
        marginBottom: 5
    },

    price: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 7
    },

    location: {
        fontSize: 14,
        color: '#8e8e93'
    },

    emptyContainer: {
        paddingTop: 100,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 120
    },

    emptyIcon: {
        marginBottom: 12
    },

    emptyText: {
        fontSize: 20,
        color: '#8e8e93'
    },
});