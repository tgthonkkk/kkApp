import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  Dimensions
} from 'react-native';

import { db } from '../api/firebase';
import { doc, getDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const DEFAULT_PROFILE_IMG = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

function DetailScreen({ route }) {

    const { item: initialItem, productId } = route.params || {};

    const [item, setItem] = useState(initialItem || null);
    const [loading, setLoading] = useState(!initialItem);
    const [modalVisible, setModalVisible] = useState(false);

    const [activeImageIndex, setActiveImageIndex] = useState(0); 
    const [selectedModalIndex, setSelectedModalIndex] = useState(0);

    useEffect(() => {
        const fetchPostAndUser = async () => {
            try {
                let postData = initialItem;

                if (!postData && productId) {
                    const docRef = doc(db, "posts", productId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        postData = { id: docSnap.id, ...docSnap.data() };
                    }
                }

                if (postData) {
                    const writerId = item?.authorUid || item?.userId || item?.uid;
                    if (writerId) {
                        const userDocRef = doc(db, "users", writerId);
                        const userDocSnap = await getDoc(userDocRef);
                        
                        if (userDocSnap.exists()) {
                            const userData = userDocSnap.data();
                            console.log("작성자 DB 정보:", userData);

                            postData = {
                                ...postData,
                                profileImage: userData.profileImage || userData.profileImageUrl || userData.photoURL || null,
                                nickname: userData.nickname || userData.displayName || postData.nickname || '익명',
                                school: userData.school || postData.school || '학교 정보 없음',
                                phonenum: userData.phonenum || userData.phoneNumber || postData.phonenum
                            };
                        } else {
                            console.log("users 컬렉션에서 해당 유저를 찾을 수 없음");
                        }
                    } else {
                        console.log("posts 컬렉션 데이터에 작성자 ID(userId/uid 등)가 없음");
                    }
                    setItem({ ...postData });
                } else {
                    Alert.alert("오류", "게시물을 찾을 수 없습니다.");
                }
            } catch (e) {
                console.error(e);
                Alert.alert("오류", "게시물을 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }

        };

        fetchPostAndUser();

    }, [initialItem, productId]);

    if (loading) {

        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="black" />
            </View>
        );

    }

    if (!item) {

        return (
            <View style={styles.container}>
                <Text>게시물이 존재하지 않습니다.</Text>
            </View>
        );

    }

    const sendMessage = () => {
        if(!item.phonenum) {
            alert('작성자의 전화번호가 등록되지 않았습니다.');
            return;
        }

        const defaultMessage = `안녕하세요! <${item.title}> 게시물 보고 연락드렸습니다. 거래 가능한가요?`;

        const separator = Platform.OS === 'ios' ? '&' : '?';
        const url = `sms:${item.phonenum}${separator}body=${encodeURIComponent(defaultMessage)}`;

        Linking.canOpenURL(url)
            .then((supported) => {
                if (!supported) {
                    Alert.alert('오류', '문자 앱을 열 수 없습니다.');
                } else {
                    return Linking.openURL(url);
                }
            })
            .catch((err) => console.error('문자 열기 에러:', err));
    };

    const isRent = item.type === 'RENT';
    const badgeBgColor = isRent ? '#0288d1' : '#388e3c';

    const formattedPrice = `${item.price ? item.price.toLocaleString() : 0}원${isRent ? ' / 일' : ''}`;

    const profileImageSource = {
        uri: (item.profileImage && typeof item.profileImage === 'string' && item.profileImage.trim() !== '') 
            ? item.profileImage 
            : DEFAULT_PROFILE_IMG
    };

    const handleScroll = (event) => {
        const slide = Math.ceil(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
        if (slide !== activeImageIndex) {
            setActiveImageIndex(slide);
        }
    };

    const openModalAt = (index) => {
        setSelectedModalIndex(index);
        setModalVisible(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
                {item.imageUrls && item.imageUrls.length > 0 ? (
                    <View style={styles.imageSliderContainer}>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                        >
                            {item.imageUrls.map((url, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    activeOpacity={0.9} 
                                    onPress={() => openModalAt(index)}
                                >
                                    <Image
                                        source={{ uri: url }}
                                        style={styles.squareImage}
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {item.imageUrls.length > 1 && (
                            <View style={styles.paginationBadge}>
                                <Text style={styles.paginationText}>
                                    {activeImageIndex + 1} / {item.imageUrls.length}
                                </Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.noImage}>
                        <Text style={styles.noImageText}>이미지가 없습니다.</Text>
                    </View>
                )}

                <View style={styles.contentContainer}>
                    <Text style={[styles.badge, isRent ? styles.rentBadge : styles.sellBadge]}>
                        {isRent ? '대여' : '판매'}
                    </Text>

                    <Text style={styles.title}>{item.title}</Text>

                    <Text style={styles.price}>{formattedPrice}</Text>

                    <View style={styles.divider} />

                    <View style={styles.profileSection}>
                        <Image source={profileImageSource} style={styles.profileImage} />
                        <View style={styles.profileInfo}>
                            <Text style={styles.nicknameText}>{item.nickname || '익명'}</Text>
                            <Text style={styles.schoolText}>{item.school || '학교 정보 없음'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.contentText}>{item.content}</Text>
                </View>
            </ScrollView>

            <Modal
                visible={modalVisible}
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setModalVisible(false)}
                    >
                        <Text style={styles.modalCloseText}>✕</Text>
                    </TouchableOpacity>

                    {item.imageUrls && item.imageUrls.length > 0 && (
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            contentOffset={{ x: selectedModalIndex * width, y: 0 }}
                            style={styles.modalScrollView}
                        >
                            {item.imageUrls.map((url, index) => (
                                <View key={index} style={styles.fullImageContainer}>
                                    <Image
                                        source={{ uri: url }}
                                        style={styles.fullImage}
                                        resizeMode="contain"
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </Modal>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.chatButton} onPress={sendMessage}>
                    <Text style={styles.chatButtonText}>문자 거래</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageSliderContainer: {
        position: 'relative',
        width: width,
        height: width,
    },
    squareImage: {
        width: width,
        height: width,
        resizeMode: 'cover',
    },
    paginationBadge: {
        position: 'absolute',
        bottom: 15,
        right: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    paginationText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    noImage: {
        width: width,
        height: width,
        backgroundColor: '#f1f3f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        color: '#888',
        fontSize: 16,
    },
    contentContainer: {
        padding: 20,
    },
    badge: {
        fontSize: 13,
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
        overflow: 'hidden',
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    rentBadge: {
        backgroundColor: '#e1f5fe',
        color: '#0288d1',
    },
    sellBadge: {
        backgroundColor: '#e8f5e9',
        color: '#388e3c',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#111',
    },
    price: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginBottom: 15,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 15,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e1e1e1',
        marginRight: 12,
    },
    profileInfo: {
        justifyContent: 'center',
    },
    nicknameText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 2,
    },
    schoolText: {
        fontSize: 13,
        color: '#666',
    },
    contentText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        marginBottom: 60,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        marginBottom: 40,
    },
    chatButton: {
        backgroundColor: '#000',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    modalCloseText: {
        color: '#fff',
        fontSize: 30,
        fontWeight: 'bold',
    },
    modalScrollView: {
        flexGrow: 0,
        height: '80%',
    },
    fullImageContainer: {
        width: width,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: width,
        height: '100%',
    },
});

export default DetailScreen;