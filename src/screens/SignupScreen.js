import React, { useState } from "react";
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Alert, Modal } from "react-native";
import { signUp } from '../api/signservice';
import SchoolSearchModal from './SchoolSearchModal';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen({navigation}) {
    const [phonenum, setPhonenum] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [school, setSchool] = useState('');
    const [major, setMajor] = useState('');
    const [grade, setGrade] = useState('');

    const [schoolModal, setSchoolModal] = useState(false);
    const [majorModal, setMajorModal] = useState(false);
    const majorOptions = ['공학/자연', '미술/건축', '음악/체육', '의학/보건', '인문/상경', '사범/교육', '기타'];

    const [modal, setModal] = useState(false);

    const signupfunc = async () => {
        if (phonenum === '' ||email === '' || password === '' || nickname === '' || school === '' || major === '' || grade === '') {
            Alert.alert('모든 정보를 입력해 주세요');
            return;
        }
        try {
            await signUp(email, password, { phonenum, nickname, school, major, grade });
            Alert.alert(
                '회원가입 완료', 
                '로그인을 진행해 주세요.', 
                [{ text: '확인', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                Alert.alert('회원가입 실패', '이미 가입된 이메일입니다.');
            }
            else Alert.alert('회원가입 실패', error.message);
        }
    };
    
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.label}>전화번호</Text>
            <TextInput 
                style={styles.input}
                placeholder="전화번호 ('-' 제외)"
                value={phonenum}
                onChangeText={(text) => setPhonenum(text)}
                keyboardType="phone-pad"
                maxLength={11}
            />

            <Text style={styles.label}>이메일</Text>
            <TextInput 
                style={styles.input}
                placeholder="example@email.com"
                value={email}
                onChangeText={(text) => setEmail(text)}
                keyboardType="email-address"
            />
            
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
                style={styles.input}
                placeholder="비밀번호"
                value={password}
                onChangeText={(text) => setPassword(text)}
                keyboardType="ascii-capable"
                secureTextEntry={true}
                autoCapitalize="none"
            />

            <Text style={styles.label}>닉네임</Text>
            <TextInput 
                style={styles.input}
                placeholder="닉네임"
                value={nickname}
                onChangeText={(text) => setNickname(text)}
            />

            <Text style={styles.label}>학교</Text>
            <TouchableOpacity
                style={styles.selectOption}
                onPress={() => {
                    setSchoolModal(true);
                    setMajorModal(false);
                }}
            >
                <Text style={{ color: school ? '#333' : '#ccc', fontSize: 16 }}>
                    {school ? school : "학교를 검색해 주세요"}
                </Text>
                <Ionicons name="search-outline" size={17} color="black" />
            </TouchableOpacity>

            <SchoolSearchModal 
                visible={schoolModal}
                onClose={() => setSchoolModal(false)}
                onSelect={(selectedSchool) => setSchool(selectedSchool)}
            />


            <Text style={styles.label}>전공</Text>
           <TouchableOpacity
                style={styles.selectOption}
                onPress={() => {setMajorModal(!majorModal);}}
            >
                <Text style={{ color: major ? '#333' : '#ccc', fontSize: 16 }}>
                    {major ? major : "전공을 선택해 주세요"}
                </Text>
                <Text style={{ color: '#666' }}>▼</Text>
            </TouchableOpacity>

            {majorModal && (
                <View style={styles.dropdownbox}>
                    {majorOptions.map((m, index) => (
                        <TouchableOpacity
                            key={m}
                            style={[
                                styles.modalitem,
                                index === majorOptions.length - 1 && { borderBottomWidth: 0 }
                            ]}
                            onPress={() => {
                                setMajor(m);
                                setMajorModal(false);
                            }}
                        >
                            <Text>{m}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Text style={styles.label}>학년</Text>
            <TouchableOpacity
                style={styles.gradeoption}
                onPress={() => setModal(!modal)}
            >
                <Text style={{ color: grade ? '#333' : '#ccc', fontSize: 16 }}>
                    {grade ? grade: "학년을 선택해 주세요"}
                </Text>
                <Text style={{ color: '#666' }}>▼</Text>
            </TouchableOpacity>

            {modal && (
                <View style={styles.dropdownbox}>
                    {['1학년', '2학년','3학년', '4학년'].map((g) => (
                        <TouchableOpacity
                            key={g}
                            style={styles.modalitem}
                            onPress={() => {
                                setGrade(g);
                                setModal(false);
                            }}
                        >
                            <Text>{g}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
    
            <TouchableOpacity 
                style={styles.signupbutton} 
                onPress={signupfunc}
            >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>회원가입</Text>
            </TouchableOpacity>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 25,
        paddingTop: 60,
        paddingBottom: 300,
        backgroundColor: '#fff'
    },

    label: {
        fontSize: 17,
        marginBottom: 10,
        fontWeight: '500'
    },

    input: {
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
        height: 40
    },

    signupbutton: {
        height: 50,
        backgroundColor: 'black',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25
    },

    selectOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#000',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
        height: 40,
        backgroundColor: '#fff'
    },

    gradeoption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'black',
        padding: 10,
        borderRadius: 5,
        marginBottom: 5,
        height: 40,
        backgroundColor: '#fff'
    },

    dropdownbox: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        marginBottom: 20,
        paddingHorizontal: 10
    },

    modalitem: {
        paddingVertical: 15,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
    }
});