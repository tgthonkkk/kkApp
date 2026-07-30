import React, { useState, useEffect } from 'react';
import { 
    SafeAreaView, 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Image, 
    StyleSheet, 
    ScrollView, 
    Alert, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, storage } from '../api/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigation } from '@react-navigation/native';

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const user = auth.currentUser;

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [profileImage, setProfileImage] = useState(null);
    const [nickname, setNickname] = useState('');
    const [major, setMajor] = useState('');
    const [grade, setGrade] = useState('');

    const [modal, setModal] = useState(false);
    const [majorModal, setMajorModal] = useState(false);

    const [email, setEmail] = useState('');
    const [school, setSchool] = useState('');

    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const majorList = [
        '공학/자연',
        '미술/건축',
        '음악/체육',
        '의학/보건',
        '인문/상경',
        '사범/교육',
        '기타'
    ];

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();

                    setProfileImage(data.profileImage || null);
                    setNickname(data.nickname || '');
                    setMajor(data.major || '');
                    setGrade(data.grade || '');
                    setEmail(data.email || user.email || '');
                    setSchool(data.school || '');
                }
            } catch (error) {
                console.error('유저 정보 불러오기 실패:', error);
                Alert.alert('오류', '프로필 정보를 불러오지 못했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user?.uid]);

    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const uploadProfileImage = async (uri) => {
        if (!uri) return null;
        if (uri.startsWith('http://') || uri.startsWith('https://')) {
            return uri;
        }

        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `profiles/${user.uid}_profile.jpg`);
        
        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    };

    const handleChangePassword = async () => {
        if (!currentPassword) {
            Alert.alert('알림', '현재 비밀번호를 입력해 주세요.');
            return;
        }
        if (!newPassword) {
            Alert.alert('알림', '새 비밀번호를 입력해 주세요.');
            return;
        }

        setChangingPassword(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            Alert.alert('성공', '비밀번호가 성공적으로 변경되었습니다.');

            setCurrentPassword('');
            setNewPassword('');
            setShowPasswordSection(false);
        } catch (error) {
            console.error('비밀번호 변경 실패:', error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                Alert.alert('오류', '현재 비밀번호가 일치하지 않습니다.');
            } else if (error.code === 'auth/requires-recent-login') {
                Alert.alert('오류', '보안을 위해 다시 로그인 후 시도해 주세요.');
            } else {
                Alert.alert('오류', '비밀번호 변경 중 오류가 발생했습니다.');
            }
        } finally {
            setChangingPassword(false);
        }
    };

    const handleSave = async () => {
        if (!nickname.trim()) {
            Alert.alert('알림', '닉네임을 입력해 주세요.');
            return;
        }

        if (!user) {
            Alert.alert('오류', '로그인 정보가 없습니다.');
            return;
        }

        setUpdating(true);
        try {
            const uploadedImageUrl = await uploadProfileImage(profileImage);

            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                profileImage: uploadedImageUrl || null,
                nickname: nickname.trim(),
                major: major,
                grade: grade,
            });

            Alert.alert('완료', '프로필이 성공적으로 수정되었습니다.');
            navigation.goBack();
        } catch (error) {
            console.error('프로필 저장 에러:', error);
            Alert.alert('오류', '프로필 수정에 실패했습니다.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView 
                        contentContainerStyle={styles.container}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.imageSection}>
                            <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
                                <Image
                                    source={{
                                        uri: profileImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
                                    }}
                                    style={styles.profileImage}
                                />
                                <View style={styles.editBadge}>
                                    <Ionicons name="camera-outline" size={20} color="#333" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>닉네임</Text>
                            <TextInput
                                style={styles.input}
                                value={nickname}
                                onChangeText={setNickname}
                                placeholder="닉네임을 입력하세요"
                            />

                            <Text style={styles.label}>전공</Text>
                            <TouchableOpacity
                                style={styles.gradeoption}
                                onPress={() => {
                                    setModal(false);
                                    setMajorModal(!majorModal);
                                }}
                            >
                                <Text style={{ color: major ? '#333' : '#ccc', fontSize: 15 }}>
                                    {major ? major : "전공을 선택해 주세요"}
                                </Text>
                                <Text style={{ color: '#666' }}>▼</Text>
                            </TouchableOpacity>

                            {majorModal && (
                                <View style={styles.dropdownbox}>
                                    {majorList.map((m) => (
                                    <TouchableOpacity
                                        key={m}
                                        style={styles.modalitem}
                                        onPress={() => {
                                        setMajor(m);
                                        setMajorModal(false);
                                        }}
                                    >
                                        <Text style={styles.dropdownText}>{m}</Text>
                                    </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <Text style={styles.label}>학년</Text>
                            <TouchableOpacity
                                style={styles.gradeoption}
                                onPress={() => setModal(!modal)}
                            >
                                <Text style={{ color: grade ? '#333' : '#ccc', fontSize: 15 }}>
                                    {grade ? grade : "학년을 선택해 주세요"}
                                </Text>
                                <Text style={{ color: '#666' }}>▼</Text>
                            </TouchableOpacity>

                            {modal && (
                                <View style={styles.dropdownbox}>
                                    {['1학년', '2학년', '3학년', '4학년'].map((g) => (
                                        <TouchableOpacity
                                            key={g}
                                            style={styles.modalitem}
                                            onPress={() => {
                                                setGrade(g);
                                                setModal(false);
                                            }}
                                        >
                                            <Text style={styles.dropdownText}>{g}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <Text style={[styles.label, styles.disabledLabel]}>학교</Text>
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={school}
                                editable={false}
                            />

                            <Text style={[styles.label, styles.disabledLabel]}>이메일</Text>
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={email}
                                editable={false}
                            />

                            <Text style={styles.label}>비밀번호</Text>
                            <View style={styles.passwordRow}>
                                <TextInput
                                    style={[styles.input, styles.disabledInput, { flex: 1, marginBottom: 0 }]}
                                    value="*********"
                                    editable={false}
                                    secureTextEntry={true}
                                />
                                <TouchableOpacity 
                                    style={styles.passwordEditButton}
                                    onPress={() => setShowPasswordSection(!showPasswordSection)}
                                >
                                    <Text style={styles.passwordEditText}>
                                        {showPasswordSection ? '취소' : '수정'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {showPasswordSection && (
                                <View style={styles.passwordChangeBox}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="현재 비밀번호"
                                        secureTextEntry
                                        value={currentPassword}
                                        onChangeText={setCurrentPassword}
                                    />
                                    <TextInput
                                        style={[styles.input, { marginTop: 8 }]}
                                        placeholder="새 비밀번호"
                                        secureTextEntry
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                    />
                                    <TouchableOpacity 
                                        style={styles.passwordSubmitButton}
                                        onPress={handleChangePassword}
                                        disabled={changingPassword}
                                    >
                                        {changingPassword ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <Text style={styles.passwordSubmitText}>비밀번호 변경하기</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}

                        </View>

                        {updating ? (
                            <View style={styles.saveButton}>
                                <ActivityIndicator color="#fff" />
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>수정 완료</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        padding: 20,
        paddingBottom: 60,
    },
    imageSection: {
        alignItems: 'center',
        marginVertical: 15,
    },
    imageWrapper: {
        position: 'relative',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#eee',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fff',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 14,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        backgroundColor: '#fff',
    },
    gradeoption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    dropdownbox: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginTop: 4,
        backgroundColor: '#fff',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    modalitem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dropdownText: {
        fontSize: 15,
        color: '#333',
    },
    disabledLabel: {
        color: '#888',
    },
    disabledInput: {
        backgroundColor: '#f5f5f5',
        color: '#777',
        borderColor: '#e0e0e0',
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    passwordEditButton: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    passwordEditText: {
        fontSize: 14,
        color: '#333',
        fontWeight: 'bold',
    },
    passwordChangeBox: {
        marginTop: 10,
        padding: 12,
        backgroundColor: '#fafafa',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
    },
    passwordSubmitButton: {
        backgroundColor: '#555',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 10,
    },
    passwordSubmitText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});