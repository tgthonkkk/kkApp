import React, {useState} from "react";
import { Button } from "react-native";

import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable
} from "react-native";

import axios from "axios";


export default function SearchScreen({ navigation }) {


  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);


  const search = async()=>{
    console.log("현재 API URL:", process.env.EXPO_PUBLIC_API_URL);
    console.log("검색 버튼 클릭:", keyword);


    try{

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/search`,
        {
          keyword: keyword
        }
      );

      console.log(response.data);

      setResults(response.data);

    } catch (error) {
      if (error.response) {
        console.log("백엔드 응답 에러 (코드):", error.response.status);
      } else if (error.request) {
        console.log("서버와 통신 실패 (IP주소/방화벽/Wi-Fi 문제):", error.message);
      } else {
        console.log("기타 오류:", error.message);
      }
    }
  };


  return (

    <ScrollView keyboardShouldPersistTaps="handled">

      <View style={styles.container}>

        <Text style={styles.title}>
          AI 게시물 추천 검색
        </Text>


        <TextInput
          style={styles.input}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="검색어 입력"
        />


        <Pressable
          style={styles.button}
          onPress={search}
        >
          <Text style={styles.buttonText}>검색</Text>
        </Pressable>


        <Text style={styles.subtitle}>추천 결과</Text>


        {results && results.map((post, index) => (
          <Pressable key={index} style={styles.card}>
            <Text>{post.title}</Text>
            <Text>카테고리 : {post.category}</Text>
            <Text>작성자 : {post.author}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}



const styles = StyleSheet.create({

  container:{
    padding:20
  },


  title:{
    fontSize:24,
    marginBottom:20
  },


  subtitle:{
    fontSize:20,
    marginTop:20
  },


  input:{
    borderWidth:1,
    padding:10,
    marginBottom:10
  },


  button:{
    marginTop:10,
    padding:15,
    borderWidth:1,
    alignItems:"center"
  },


  buttonText:{
    fontSize:16
  },


  card:{
    marginTop:15,
    padding:10,
    borderWidth:1
  }


});