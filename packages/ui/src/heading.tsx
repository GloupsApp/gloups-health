"use client";

import { StyleSheet, Text } from "react-native";
import type { TextProps } from "react-native";

import { colors } from "./tokens";

const styles = StyleSheet.create({
  heading: { color: colors.text, fontSize: 28, fontWeight: "600" },
});

export type HeadingProps = Omit<TextProps, "accessibilityRole">;

export const Heading = ({ children, style, ...props }: HeadingProps) => (
  <Text {...props} accessibilityRole="header" style={[styles.heading, style]}>
    {children}
  </Text>
);
