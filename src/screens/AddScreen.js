import React, { useState, useEffect } from 'react';
import { SafeAreaView, Modal, View, TextInput, Button, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, Text, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../api/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigation, useRoute } from '@react-navigation/native';

const CATEGORY_DATA = {
    '서적': ['공학/자연', '미술/건축', '음악/체육', '의학/보건', '인문/상경', '사범/교육', '기타'],
    '전공 물품': ['공학/자연', '미술/건축', '음악/체육', '의학/보건', '인문/상경', '사범/교육', '기타'],
    '기타': ['생활용품', '의류','굿즈', '기타']
};

function AddScreen() {
    const [user, setUser] = useState(null);
    const [initializing, setInitializing] = useState(true);
    const navigation = useNavigation();

    const route = useRoute();
    const productData = route.params?.productData;
    const isEditMode = !!productData;

    const [type, setType] = useState(null);
    const [mainCategory, setMainCategory] = useState(null);
    const [subCategory, setSubCategory] = useState(null);
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [content, setContent] = useState('');
    const [imageUri, setImageUri] = useState([]);
    const [loading, setLoading] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalStep, setModalStep] = useState('MAIN');
    const [tempMain, setTempMain] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setInitializing(false);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (productData) {
            setType(productData.type || null);
            setMainCategory(productData.mainCategory || null);
            setSubCategory(productData.subCategory || null);
            setTitle(productData.title || '');
            
            if (productData.price) {setPrice(Number(productData.price).toLocaleString('ko-KR'));}
            else {setPrice('');}
            
            setContent(productData.content || '');

            if (productData.imageUrls && Array.isArray(productData.imageUrls)) {setImageUri(productData.imageUrls);}
            else if (productData.imageUrl) {setImageUri([productData.imageUrl]);}
            else {setImageUri([]);}
        }
        else {
            setType(null);
            setMainCategory(null);
            setSubCategory(null);
            setTitle('');
            setPrice('');
            setContent('');
            setImageUri([]);
        }
    }, [productData]);

    const openModal = () => {
        setModalStep('MAIN');
        setTempMain(null);
        setModalVisible(true);
    };

    const selectMainCategory = (mainCat) => {
        setTempMain(mainCat);
        setModalStep('SUB');
    }

    const selectSubCategory = (subCat) => {
        setMainCategory(tempMain);
        setSubCategory(subCat);
        setModalVisible(false);
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('권한 필요', '사진에 접근하려면 갤러리 접근 권한이 필요합니다.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.8,
        });

        if (!result.canceled) {
            const selectedUri = result.assets.map((asset) => asset.uri);
            setImageUri((prev) => [...prev, ...selectedUri].slice(0,5));
        }
    };

    const removeImage = (indexToRemove) => {
        setImageUri((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const uploadImagesToStorage = async (uris) => {
        if (!uris || uris.length === 0) return [];
        
        const uploadPromises = uris.map(async (uri) => {
            const response = await fetch(uri);
            const blob = await response.blob();

            const filename = `posts/${user.uid}_${Date.now()}_${Math.random()}.jpg`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            return await getDownloadURL(storageRef);
        });

        return await Promise.all(uploadPromises);
    };

    const Upload = async () => {
        if (!type) {
            Alert.alert('알림', '대여 또는 판매 방식을 선택해주세요.');
            return;
        }

        if (!mainCategory || !subCategory) {
            Alert.alert('알림', '카테고리를 모두 선택해주세요.');
            return;
        }

        if (!title.trim()) {
            Alert.alert('알림', '제목을 입력해주세요.');
            return;
        }
        if (!price.trim()) {
            Alert.alert('알림', '가격을 입력해주세요.');
            return;
        }
        if (!content.trim()) {
            Alert.alert('알림', '내용을 입력해주세요.');
            return;
        }

        setLoading(true);

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (!userDocSnap.exists()) {
                Alert.alert('오류', '유저 정보를 찾을 수 없습니다.');
                setLoading(false);
                return;
            }
            
            const userData = userDocSnap.data();

            let imageUrls = [];

            if (imageUri && imageUri.length > 0) {
                const existingUrls = imageUri.filter((uri) => uri.startsWith('http'));
                const newUris = imageUri.filter((uri) => !uri.startsWith('http'));

                let uploadedUrls = [];
                if (newUris.length > 0) {
                    uploadedUrls = await uploadImagesToStorage(newUris);
                }

                imageUrls = [...existingUrls, ...uploadedUrls];
            }

            const postData = {
                type: type,
                mainCategory: mainCategory,
                subCategory: subCategory,
                title: title,
                price: Number(price.replace(/,/g,'')),
                content: content,
                imageUrls: imageUrls.filter(Boolean),
                authorUid: user.uid,
                authorEmail: user.email,
                school: userData.school,  
                major: userData.major,
                nickname: userData.nickname || '익명',
                phonenum: userData.phonenum,
            };

            if (isEditMode && productData?.id) {
                const postRef = doc(db, 'posts', productData.id);
                await updateDoc(postRef, {
                    ...postData,
                    updatedAt: serverTimestamp(), 
                });
                Alert.alert('성공', '게시물이 수정되었습니다.');
            } else {
                await addDoc(collection(db, 'posts'), {
                    ...postData,
                    createdAt: serverTimestamp(),
                });
                Alert.alert('성공', '게시물이 등록되었습니다.');
            }

            setTitle('');
            setContent('');
            setImageUri([]);
            navigation.goBack();
        } catch (error) {
            console.error('업로드 중 에러 발생:', error);
            Alert.alert('오류', isEditMode ? '게시물 수정에 실패했습니다.' : '게시물 등록에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="black" />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.loginContainer}>
                <Text style={styles.ment}>
                    안전한 대여·판매를 위해{"\n"} 로그인이 필요해요! 
                </Text>
                
                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.button}>
                    <Text style={styles.logintext}>로그인/회원가입</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.Title}>거래 방식</Text>
                <View style={styles.typeContainer}>
                    <TouchableOpacity
                        style={[styles.typeButton, type === 'RENT' && styles.typeButtonSelected]}
                        onPress={() => setType('RENT')}
                    >
                        <Text style={[styles.typeText, type === 'RENT' && styles.typeTextSelected]}>대여</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.typeButton, type === 'SELL' && styles.typeButtonSelected]}
                        onPress={() => setType('SELL')}
                    >
                        <Text style={[styles.typeText, type === 'SELL' && styles.typeTextSelected]}>판매</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.Title}>카테고리</Text>
                <TouchableOpacity style={styles.categorySelectButton} onPress={openModal}>
                    <Text style={[styles.categorySelectText, mainCategory && styles.categorySelectTextActive]}>
                        {mainCategory && subCategory
                            ? `${mainCategory} > ${subCategory}`
                            : '카테고리를 선택하세요'}
                    </Text>
                    <Text style={styles.arrowText}>❯</Text>
                </TouchableOpacity>

                <Text style={styles.Title}>게시물 제목</Text>
                <TextInput
                    style={styles.titleInput}
                    placeholder="제목을 입력하세요."
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.Title}>가격</Text>
                <View style={styles.priceInputContainer}>
                    <Text style={styles.wonsymbol}>{'\u20A9'}</Text>
                    <TextInput
                        style={styles.priceInput}
                        placeholder="가격을 입력하세요."
                        value={price}
                        onChangeText={(text) => {
                            const onlyNums = text.replace(/[^0-9]/g, '');
                            if (!onlyNums) {setPrice('');}
                            else {setPrice(Number(onlyNums).toLocaleString('ko-KR'));}
                        }}
                        keyboardType="numeric"
                    />
                </View>

                <Text style={styles.Title}>게시물 내용</Text>
                <TextInput
                    style={styles.contentInput}
                    placeholder="내용을 입력하세요."
                    value={content}
                    onChangeText={setContent}
                    multiline
                />

                <Text style={styles.Title}>사진 첨부 (최대 5장)</Text>
                <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                    <Text style={styles.imagePickerText}>사진 선택</Text>
                </TouchableOpacity>

                {imageUri?.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageListContainer}>
                        {imageUri.map((uri, index) => (
                            <View key={index} style={styles.imagePreviewWrapper}>
                                <Image source={{ uri }} style={styles.previewImage} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => removeImage(index)}
                                >
                                    <Text style={styles.removeImageText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {loading ? (
                    <View style={styles.submitButton}>
                        <ActivityIndicator size="small" color="white" />
                    </View>
                ) : (
                    <TouchableOpacity style={styles.submitButton} onPress={Upload}>
                        <Text style={styles.submitButtonText}>{isEditMode ? '게시물 수정' : '게시물 등록'}</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
            <Modal visible={modalVisible} animationType='slide' transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {modalStep === 'MAIN' ? '메인 카테고리' : `${tempMain} > 세부 카테고리`}
                        </Text>

                        {modalStep === 'MAIN' ? (
                            Object.keys(CATEGORY_DATA).map((main) => (
                                <TouchableOpacity key={main} style={styles.modalItem} onPress={() => selectMainCategory(main)}>
                                    <Text style={styles.modalItemText}>{main}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            CATEGORY_DATA[tempMain]?.map((sub) => (
                                <TouchableOpacity key={sub} style={styles.modalItem} onPress={() => selectSubCategory(sub)}>
                                    <Text style={styles.modalItemText}>{sub}</Text>
                                </TouchableOpacity>
                            ))
                        )}
                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.modalCloseText}>닫기</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: {
        paddingHorizontal: 25,
        paddingTop: 30,
        paddingBottom: 100,
        backgroundColor: '#fff'
    },
    loginContainer: {
        flex: 1, 
        justifyContent: 'flex-start', 
        alignItems: 'center', 
        paddingTop: 150 
    },
    ment: {
        fontSize: 33, 
        color: 'black', 
        fontWeight: '600', 
        marginBottom: 60, 
        textAlign: 'center', 
        lineHeight: 50, 
        letterSpacing: 1 
    },
    button: {
        backgroundColor: '#000', 
        paddingVertical: 20, 
        paddingHorizontal: 100, 
        borderRadius: 8
    },
    logintext: {
        color: '#fff', 
        fontSize: 20, 
        fontWeight: '500'
    },
    Title: {
        marginTop: 20,
        fontSize: 17,
        marginBottom: 10,
        fontWeight: '500'
    },
    typeContainer: {
        flexDirection: 'row',
        marginBottom: 10
    },
    typeButton: {
        flex: 1,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        alignItems: 'center',
        marginRight: 8,
        backgroundColor: '#f9f9f9'
    },
    typeButtonSelected: {
        backgroundColor: '#000',
        borderColor: '#000'
    },
    typeText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#666'
    },
    typeTextSelected: {
        color: '#fff'
    },
    categorySelectButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 15,
        backgroundColor: '#fff',
        marginTop: 3,
        marginBottom: 10
    },
    categorySelectText: {
        fontSize: 15,
        color: '#999'
    },
    categorySelectTextActive: {
        color: '#000',
        fontWeight: '600'
    },
    arrowText: {
        fontSize: 14,
        color: '#888'
    },
    titleInput: {
        marginTop: 3,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        fontSize: 15,
        marginBottom: 10,
    },
    contentInput: {
        marginTop: 3,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        fontSize: 15,
        minHeight: 120,
        marginBottom: 10,
        textAlignVertical: 'top',
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#fff'
    },
    wonsymbol: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginRight: 6
    },
    priceInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: '#000'
    },
    imagePickerButton: {
        marginTop: 3,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#888',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    imagePickerText: {
        color: '#555',
        fontWeight: '600',
    },
    imageListContainer: {
        marginTop: 12,
        flexDirection: 'row'
    },
    imagePreviewWrapper: {
        position: 'relative',
        marginRight: 10
    },
    previewImage: {
        width: 90,
        height: 90,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        width: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15,
    },
    removeImageText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    submitButton: {
        height: 50,
        backgroundColor: 'black',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'flex-end' 
    },
    modalContent: { 
        backgroundColor: '#fff', 
        borderTopLeftRadius: 16, 
        borderTopRightRadius: 16, 
        padding: 20, 
        maxHeight: '60%' 
    },
    modalTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 15, 
        textAlign: 'center' 
    },
    modalItem: { 
        paddingVertical: 15, 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee' 
    },
    modalItemText: { 
        fontSize: 16, 
        textAlign: 'center' 
    },
    modalCloseButton: { 
        marginTop: 15, 
        paddingVertical: 12, 
        backgroundColor: '#eee', 
        borderRadius: 8, 
        alignItems: 'center' 
    },
    modalCloseText: { 
        fontSize: 15, 
        fontWeight: '600', 
        color: '#333' 
    }
});

export default AddScreen;