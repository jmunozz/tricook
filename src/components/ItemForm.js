import React, {useState} from 'react';
import {View, TextInput, Button, StyleSheet} from 'react-native';

export default function ItemForm({onSubmit, initialItem = {}}) {
  const [name, setName] = useState(initialItem.name || '');
  const [detail, setDetail] = useState(initialItem.detail || '');
  const [quantity, setQuantity] = useState(initialItem.quantity ? String(initialItem.quantity) : '');
  const [unit, setUnit] = useState(initialItem.unit || '');
  const [rayon, setRayon] = useState(initialItem.rayon || '');

  const handleSubmit = () => {
    onSubmit({name, detail, quantity: Number(quantity), unit, rayon});
    setName('');
    setDetail('');
    setQuantity('');
    setUnit('');
    setRayon('');
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Nom" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Détail" value={detail} onChangeText={setDetail} style={styles.input} />
      <TextInput placeholder="Quantité" value={quantity} onChangeText={setQuantity} keyboardType="numeric" style={styles.input} />
      <TextInput placeholder="Unité" value={unit} onChangeText={setUnit} style={styles.input} />
      <TextInput placeholder="Rayon" value={rayon} onChangeText={setRayon} style={styles.input} />
      <Button title="Enregistrer" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {marginVertical: 8},
  input: {borderWidth: 1, borderColor: '#ccc', marginVertical: 4, padding: 8}
});
