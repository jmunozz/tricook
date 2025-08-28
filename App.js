import React, {useEffect} from 'react';
import {SafeAreaView, ScrollView, StyleSheet} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import {TricookProvider, useTricook} from './src/context/TricookContext';
import CategorySection from './src/components/CategorySection';
import MenuSection from './src/components/MenuSection';
import {defaultItems} from './src/data/defaultItems';

function Content() {
  const {createInstance} = useTricook();
  useEffect(() => {
    createInstance('owner@tricook.local');
  }, []);

  return (
    <ScrollView style={styles.container}>
      <CategorySection category="breakfast" />
      <MenuSection />
      <CategorySection category="apero" />
      <CategorySection category="common" />
    </ScrollView>
  );
}

export default function App() {
  return (
    <TricookProvider preconfiguredItems={defaultItems}>
      <SafeAreaView style={{flex: 1}}>
        <Content />
        <StatusBar style="auto" />
      </SafeAreaView>
    </TricookProvider>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16, marginTop: 40}
});
