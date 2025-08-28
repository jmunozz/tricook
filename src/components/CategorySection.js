import React from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import ItemForm from './ItemForm';
import {useTricook} from '../context/TricookContext';

const titles = {
  breakfast: 'Petit-déjeuner',
  apero: 'Apéro',
  common: 'Communs'
};

export default function CategorySection({category}) {
  const {state, addItem} = useTricook();
  const items = state[category];

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{titles[category]}</Text>
      <ItemForm onSubmit={item => addItem(category, item)} />
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.item}>
            <Text>
              {item.quantity} {item.unit} {item.name}
              {item.detail ? ` (${item.detail})` : ''}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {marginBottom: 24},
  title: {fontSize: 18, fontWeight: 'bold', marginBottom: 8},
  item: {paddingVertical: 4}
});
