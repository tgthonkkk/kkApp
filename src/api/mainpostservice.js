import { auth, db } from '../api/firebase';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const getCurrentUser = () => {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
};

export const fetchUserData = async () => {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
            console.log("로그인된 유저가 없습니다.");
            return null;
        }

        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            return userDocSnap.data();
        }
        return null;
    } catch (error) {
        console.error("유저 정보 불러오기 에러:", error);
        throw error;
    }
};

export const fetchProductsBySchool = async (school) => {
    try {
        const rentQuery = query(
            collection(db, 'posts'),
            where('school', '==', school),
            where('type', '==', 'RENT'),
            orderBy('createdAt', 'desc')
        );

        const saleQuery = query(
            collection(db, 'posts'),
            where('school', '==', school),
            where('type', '==', 'SELL'),
            orderBy('createdAt', 'desc')
        );

        const [rentSnapshot, saleSnapshot] = await Promise.all([
            getDocs(rentQuery),
            getDocs(saleQuery)
        ]);

        const rentProducts = rentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const saleProducts = saleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { rentProducts, saleProducts };
    } catch (error) {
        console.error("게시물 쿼리 에러:", error);
        throw error;
    }
};

export const fetchProductsByMajor = async (userMajor) => {
    try {
        if (!userMajor) return [];

        const postsRef = collection(db, 'posts');

        const simpleQuery = query(
            postsRef,
            where('subCategory', '==', userMajor)
        );

        const querySnapshot = await getDocs(simpleQuery);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("전공 상품 불러오기 에러:", error);
        return [];
    }
};