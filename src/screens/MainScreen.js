import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, Alert, StyleSheet, View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserData, fetchProductsBySchool, fetchProductsByMajor } from '../api/mainpostservice';
import { useFocusEffect } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { SafeAreaFrameContext } from 'react-native-safe-area-context';

export default function MainScreen({navigation}) {
    const [rentProducts, setRentProducts] = useState([]);
    const [saleProducts, setSaleProducts] = useState([]);
    const [majorProducts, setMajorProducts] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const checkAuthAndNavigate = (action) => {
        if (isLoggedIn) {
            action();
        } else {
            navigation.navigate("Login");
        }
    };
    
    useFocusEffect(
        useCallback(() => {
            let isMounted = true;

            const loadData = async () => {
                try {
                    setLoading(true);
                    const auth = getAuth();
                    const currentUser = auth.currentUser;

                    if (currentUser) {
                        if (isMounted) setIsLoggedIn(true);

                        const userData = await fetchUserData();
                        if (isMounted) setUserInfo(userData);

                        const schoolName = userData?.school || 'ALL';
                        const schoolProducts = await fetchProductsBySchool(schoolName);

                        if (isMounted && schoolProducts) {
                            setRentProducts(schoolProducts.rentProducts || []);
                            setSaleProducts(schoolProducts.saleProducts || []);
                        }

                        if (userData?.major && typeof fetchProductsByMajor === 'function') {
                            const majorData = await fetchProductsByMajor(userData.major);
                            setMajorProducts(majorData || []);
                        }
                    } else {
                        if (isMounted) {
                            setIsLoggedIn(false);
                            setUserInfo(null);
                            setRentProducts([]);
                            setSaleProducts([]);
                            setMajorProducts([]);
                        }
                    }
                } catch (error) {
                    console.error("데이터 로드 실패:", error);
                } finally {
                    if (isMounted) setLoading(false);
                }
            };

            loadData();

            return () => {
                isMounted = false;
            };
        }, [])
    );

    const renderItem = ({ item }) => {
        if (!item) return null;

        const hasImage = item.imageUrls && item.imageUrls.length > 0;
        const imageSource = hasImage
            ? { uri: item.imageUrls[0] } 
            : { uri: 'https://dummyimage.com/150x150/cccccc/ffffff.png&text=No+Image' };

        const isRent = item.type === 'RENT';
        const rawPrice = Number(item?.price) || 0;
        const formattedPrice = `${rawPrice.toLocaleString()}원${isRent ? ' / 일' : ''}`;
        
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
                <Text numberOfLines={2} ellipsizeMode='tail' style={styles.itemTitle}>
                    {item.title || '제목 없음'}
                </Text>
                <Text style={styles.itemPrice}>
                    {formattedPrice}
                </Text>
            </TouchableOpacity>
        );
    };

if (!isLoggedIn && !loading) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.loginPromptContainer}>
                <View style={styles.iconCircle}>
                    <Ionicons name="gift-outline" size={38} color="#111111" />
                </View>

                <Text style={styles.promptTitle}>
                    더 많은 상품이 기다리고 있어요!
                </Text>
                <Text style={styles.promptSubText}>
                    로그인하시면 전공 맞춤 상품 추천부터{'\n'}편리한 물품 대여 및 거래까지 이용할 수 있어요.
                </Text>

                <TouchableOpacity 
                    style={styles.primaryLoginButton}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("Login")}
                >
                    <Text style={styles.primaryLoginButtonText}>
                        로그인하고 시작하기
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.navigate("Search")}>
                        <Ionicons name="search-outline" size={26} color="#333" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate("Likelist")}>
                        <Ionicons name="heart-outline" size={26} color="#333" />
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>
                        {userInfo?.nickname || userInfo?.name || '사용자'}님을 위한 추천 상품!
                    </Text>
                    {loading ? (
                        <ActivityIndicator size='small' color='#888' style={styles.loadingIndicator} />
                    ) : (
                        <FlatList
                            horizontal
                            data={majorProducts}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                            showsHorizontalScrollIndicator={false}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>전공 관련 상품이 아직 없습니다.</Text>
                            }
                        />
                    )}
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>최신 대여 상품</Text>
                    {loading ? (
                        <ActivityIndicator size='small' color='#888' style={styles.loadingIndicator} />
                    ) : (
                        <FlatList
                            horizontal
                            data={rentProducts}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                            showsHorizontalScrollIndicator={false}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>등록된 대여 상품이 없습니다.</Text>
                            }
                        />
                    )}
                </View>

                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>최신 판매 상품</Text>
                    {loading ? (
                        <ActivityIndicator size='small' color='#888' style={styles.loadingIndicator} />
                    ) : (
                        <FlatList
                            horizontal
                            data={saleProducts}
                            renderItem={renderItem}
                            keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
                            showsHorizontalScrollIndicator={false}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>등록된 판매 상품이 없습니다.</Text>
                            }
                        />
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },

    container: {
        flex: 1,
        backgroundColor: '#fff'
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        columnGap: 16,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15
    },

    loginPromptContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
        backgroundColor: '#ffffff',
    },

    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },

    promptTitle: {
        fontSize: 21,
        fontWeight: '700',
        color: '#111111',
        marginBottom: 10,
        textAlign: 'center',
    },

    promptSubText: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },

    primaryLoginButton: {
        backgroundColor: '#111111',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },

    primaryLoginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },

    sectionContainer: {
        marginVertical: 10,
    },

    sectionTitle: {
        fontSize: 25,
        fontWeight: 'bold',
        marginLeft: 15,
        marginTop:20,
        marginBottom: 15,
    },

    itemContainer: {
        width: 150,
        marginHorizontal: 10,
        marginBottom: 20,
    },

    itemImage: {
        width: 150,
        height: 150,
        borderRadius: 8,
        backgroundColor: '#f1f3f5'
    },

    itemTitle: {
        fontSize: 17,
        fontWeight: '600',
        lineHeight: 25,
        marginTop: 8,
        color: '#333'
    },

    itemPrice: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 4,
        color: '#000'
    },

    emptyText: {
        color: '#888',
        paddingVertical: 20,
        paddingLeft: 15,
        fontSize: 17
    },

    loadingIndicator: {
        marginVertical: 20,
    }
});