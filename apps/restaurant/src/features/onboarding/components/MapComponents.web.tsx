import React from 'react';
import { View } from 'react-native';

export const MapView = React.forwardRef((props: any, ref) => (
    <View ref={ref as any} {...props} />
));

export const Marker = (props: any) => <View {...props} />;

export type Region = {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
};
