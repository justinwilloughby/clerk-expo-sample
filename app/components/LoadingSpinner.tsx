import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

// Create a loading spinner component
const LoadingSpinner = () => {
    const rotation = useSharedValue(0);
  
    useEffect(() => {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1, // Infinite repetition
      );
  
      // Cleanup animation when component unmounts
      return () => {
        cancelAnimation(rotation);
      };
    }, []);
  
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotation.value}deg` }],
    }));
  
    return (
      <Animated.View style={[styles.loaderContainer, animatedStyle]}>
        <View style={styles.loader} />
      </Animated.View>
    );
  };

  const styles = StyleSheet.create({
    loaderContainer: {
      width: 24,
      height: 24,
    },
    loader: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'white',
      borderTopColor: 'transparent', // This creates the spinning effect
    },
  });

  export default LoadingSpinner;