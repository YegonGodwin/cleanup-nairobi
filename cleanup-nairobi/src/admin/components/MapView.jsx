
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const MapView = ({ markers }) => {
  const position = [-1.286389, 36.817223]; // Nairobi coordinates
  const displayMarkers = Array.isArray(markers) ? markers : [];

  return (
    <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {displayMarkers.map((marker, index) => (
        <Marker key={index} position={marker.position}>
          <Popup>{marker.popup || 'Report Location'}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
