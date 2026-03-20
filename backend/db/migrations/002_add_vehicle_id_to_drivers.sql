-- Add vehicle_id column to drivers table
ALTER TABLE drivers
ADD COLUMN vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;

-- Create index for vehicle_id
CREATE INDEX idx_drivers_vehicle ON drivers(vehicle_id);

-- Optional: If you want to enforce one vehicle per driver (already likely by logic, but unique constraint enforces it strictly if desired)
-- ALTER TABLE drivers ADD CONSTRAINT unique_vehicle_driver UNIQUE (vehicle_id);
