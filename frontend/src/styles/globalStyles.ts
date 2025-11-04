// src/styles/globalStyles.ts
import { StyleSheet } from 'react-native';

const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  textRegular: {
    fontFamily: 'Manrope-Regular',
    color: '#1F2933',
  },
  textMedium: {
    fontFamily: 'Manrope-Medium',
    color: '#1F2933',
  },
  textBold: {
    fontFamily: 'Manrope-Bold',
    color: '#1F2933',
  },
  button: {
    width: '80%',
    marginTop: 20,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#1E88FF',
  },
  buttonText: {
    color: '#FFF',
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
  },
});

export default globalStyles;
