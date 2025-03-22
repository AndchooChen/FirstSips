import * as React from 'react';
import { TextInput } from 'react-native-paper';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}

const TextField: React.FC<TextFieldProps> = ({ label, value, onChangeText }) => {
  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      mode="outlined"
    />
  );
};

export default TextInput;