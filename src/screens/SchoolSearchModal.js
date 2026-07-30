import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';

const CAREERNET_API_KEY = ;

const formatCampusName = (schoolName = '', campusName = '') => {
    const cleanSchool = schoolName.trim();
    const cleanCampus = campusName.trim();

    if (
        cleanSchool.includes('사이버') || 
        cleanSchool.includes('디지털') || 
        cleanSchool.includes('방송통신')
    ) {
        return '';
    }

    if (cleanSchool.includes('경희')) {
        if (cleanCampus.includes('2') || cleanCampus.includes('제2') || cleanCampus.includes('국제')) return '국제캠퍼스';
        return '서울캠퍼스';
    }
    if (cleanSchool.includes('연세')) {
        if (cleanCampus.includes('2') || cleanCampus.includes('제2') || cleanCampus.includes('국제')) return '국제캠퍼스';
        return '신촌캠퍼스';
    }
    if (cleanSchool.includes('중앙')) {
        if (cleanCampus.includes('2') || cleanCampus.includes('제2') || cleanCampus.includes('안성') || cleanCampus.includes('다빈치')) return '다빈치캠퍼스';
        return '서울캠퍼스';
    }
    if (cleanSchool.includes('건국')) {
        if (cleanCampus.includes('2') || cleanCampus.includes('제2') || cleanCampus.includes('충주') || cleanCampus.includes('GLOCAL')) return 'GLOCAL캠퍼스';
        return '서울캠퍼스';
    }
    if (cleanSchool.includes('단국')) {
        if (cleanCampus.includes('2') || cleanCampus.includes('제2') || cleanCampus.includes('천안')) return '천안캠퍼스';
        return '죽전캠퍼스';
    }
    if (cleanSchool.includes('동국')) {
        if (cleanCampus.includes('2') || cleanCampus.includes('제2') || cleanCampus.includes('경주') || cleanCampus.includes('WISE')) return 'WISE캠퍼스';
        return '서울캠퍼스';
    }
    if (cleanSchool.includes('홍익')) {
        if (cleanCampus.includes('2') || cleanCampus.includes('제2') || cleanCampus.includes('세종')) return '세종캠퍼스';
        return '서울캠퍼스';
    }
    if (cleanSchool.includes('상명')) {
        if (cleanCampus.includes('2') || cleanCampus.includes('제2') || cleanCampus.includes('천안')) return '천안캠퍼스';
        return '서울캠퍼스';
    }
    if (cleanSchool.includes('명지')) {
        if (cleanCampus.includes('2') || cleanCampus.includes('제2') || cleanCampus.includes('용인') || cleanCampus.includes('자연')) return '자연캠퍼스';
        return '인문캠퍼스';
    }

    if (
        !cleanCampus || 
        cleanCampus === '본교' || 
        cleanCampus.includes('1') || 
        cleanCampus.includes('제1') ||
        cleanCampus === '제1캠퍼스'
    ) {
        return '';
    }

    return cleanCampus;
};

export default function SchoolSearchModal({ visible, onClose, onSelect }) {
    const [query, setQuery] = useState('');
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleClose = () => {
        setQuery('');
        setSchools([]);
        onClose();
    };

    const searchSchoolAPI = async (text) => {
        setQuery(text);
        if (text.trim().length < 2) {
            setSchools([]);
            return;
        }

        setLoading(true);

        try {
            const url = `https://www.career.go.kr/cnet/openapi/getOpenApi?apiKey=${CAREERNET_API_KEY}&svcType=api&svcCode=SCHOOL&contentType=json&gubun=univ_list&searchSchulNm=${encodeURIComponent(text)}`;
            const response = await fetch(url);
            const data = await response.json();

            const resultList = data.dataSearch?.content || [];

            const formattedList = resultList.map((item, index) => {
                const correctedCampus = formatCampusName(item.schoolName, item.campusName);

                return {
                    id: `${item.seq}-${index}`,
                    schoolName: item.schoolName, 
                    campusName: correctedCampus,
                    address: item.adres || ''
                };
            });

            setSchools(formattedList);
        } catch (error) {
            console.error("학교 검색 API 에러:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="학교명 입력 (2자 이상)"
                        value={query}
                        onChangeText={searchSchoolAPI}
                        autoFocus
                    />
                    <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                        <Text style={{ fontSize: 16, color: '#333' }}>닫기</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={schools}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={
                            query.length >= 2 ? (
                                <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
                            ) : (
                                <Text style={styles.emptyText}>학교명을 2자 이상 입력해 주세요.</Text>
                            )
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.item}
                                onPress={() => {
                                    const fullSchoolName = (item.campusName && item.campusName !== '본교')
                                        ? `${item.schoolName} (${item.campusName})`
                                        : item.schoolName;
                                    
                                    onSelect(fullSchoolName);
                                    onClose();
                                }}
                            >
                                <Text style={styles.schoolName}>{item.schoolName}</Text>
                                <Text style={styles.campusName}>
                                    {item.campusName}{item.address ? ` | ${item.address}` : ''}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        paddingTop: 60, 
        paddingHorizontal: 20, 
        backgroundColor: '#fff' 
    },

    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 15 
    },

    searchInput: { 
        flex: 1, 
        borderWidth: 1, 
        borderColor: '#ccc', 
        padding: 12, 
        borderRadius: 8, 
        fontSize: 16 
    },

    closeBtn: { 
        marginLeft: 15, 
        padding: 5 
    },

    item: { 
        paddingVertical: 15,
        borderBottomWidth: 1, 
        borderBottomColor: '#eee' 
    },

    schoolName: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#333' 
    },

    campusName: { 
        fontSize: 13, 
        color: '#666', 
        marginTop: 4 
    },

    emptyText: { 
        textAlign: 'center', 
        marginTop: 40, 
        color: '#999', 
        fontSize: 15 
    }
});