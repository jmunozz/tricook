import React, {useState} from 'react';
import {View, Text, TextInput, Button, FlatList, StyleSheet} from 'react-native';
import ItemForm from './ItemForm';
import {useTricook} from '../context/TricookContext';

const currentUser = 'demo@tricook.local';

function Menu({menu}) {
  const {joinMenu, leaveMenu, addMenuItem} = useTricook();
  const isMember = menu.members.includes(currentUser);

  return (
    <View style={styles.menu}>
      <Text style={styles.menuTitle}>{menu.name}</Text>
      {isMember ? (
        <>
          <Button title="Quitter" onPress={() => leaveMenu(menu.id, currentUser)} />
          <ItemForm onSubmit={item => addMenuItem(menu.id, item)} />
          <FlatList
            data={menu.items}
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
        </>
      ) : (
        <Button title="Rejoindre" onPress={() => joinMenu(menu.id, currentUser)} />
      )}
    </View>
  );
}

export default function MenuSection() {
  const {state, addMenu} = useTricook();
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    addMenu(name.trim());
    setName('');
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Menus</Text>
      <View style={styles.row}>
        <TextInput
          placeholder="Nom du menu"
          value={name}
          onChangeText={setName}
          style={[styles.input, {flex: 1}]}
        />
        <Button title="Ajouter" onPress={handleAdd} />
      </View>
      {state.menus.map(menu => (
        <Menu key={menu.id} menu={menu} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {marginBottom: 24},
  title: {fontSize: 18, fontWeight: 'bold', marginBottom: 8},
  row: {flexDirection: 'row', alignItems: 'center'},
  input: {borderWidth: 1, borderColor: '#ccc', marginRight: 8, padding: 8},
  menu: {marginVertical: 12, padding: 8, borderWidth: 1, borderColor: '#ddd'},
  menuTitle: {fontSize: 16, fontWeight: 'bold', marginBottom: 8},
  item: {paddingVertical: 4}
});
