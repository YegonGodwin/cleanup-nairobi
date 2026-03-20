import { validateCoordinates, validateNairobiBounds } from '../../utils/wasteReportHelpers.js';

describe('wasteReportHelpers - Coordinate Validation', () => {
  describe('validateCoordinates', () => {
    test('should accept null coordinates', () => {
      const result = validateCoordinates(null, null);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    test('should accept valid coordinates', () => {
      const result = validateCoordinates(-1.2921, 36.8219); // Nairobi coordinates
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    test('should reject partial coordinates (latitude only)', () => {
      const result = validateCoordinates(-1.2921, null);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Both latitude and longitude must be provided together');
    });

    test('should reject partial coordinates (longitude only)', () => {
      const result = validateCoordinates(null, 36.8219);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Both latitude and longitude must be provided together');
    });

    test('should reject invalid latitude (too high)', () => {
      const result = validateCoordinates(91, 36.8219);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Latitude must be between -90 and 90 degrees');
    });

    test('should reject invalid latitude (too low)', () => {
      const result = validateCoordinates(-91, 36.8219);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Latitude must be between -90 and 90 degrees');
    });

    test('should reject invalid longitude (too high)', () => {
      const result = validateCoordinates(-1.2921, 181);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Longitude must be between -180 and 180 degrees');
    });

    test('should reject invalid longitude (too low)', () => {
      const result = validateCoordinates(-1.2921, -181);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Longitude must be between -180 and 180 degrees');
    });
  });

  describe('validateNairobiBounds', () => {
    test('should accept null coordinates', () => {
      const result = validateNairobiBounds(null, null);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    test('should accept coordinates within Nairobi bounds', () => {
      const result = validateNairobiBounds(-1.2921, 36.8219); // Central Nairobi
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    test('should reject coordinates outside Nairobi bounds (too far north)', () => {
      const result = validateNairobiBounds(-1.0, 36.8219);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Coordinates must be within Nairobi city bounds');
    });

    test('should reject coordinates outside Nairobi bounds (too far south)', () => {
      const result = validateNairobiBounds(-1.5, 36.8219);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Coordinates must be within Nairobi city bounds');
    });

    test('should reject coordinates outside Nairobi bounds (too far east)', () => {
      const result = validateNairobiBounds(-1.2921, 37.2);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Coordinates must be within Nairobi city bounds');
    });

    test('should reject coordinates outside Nairobi bounds (too far west)', () => {
      const result = validateNairobiBounds(-1.2921, 36.5);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Coordinates must be within Nairobi city bounds');
    });
  });
});