
import React, { useState, useEffect } from 'react';
import { wasteTypes } from '../../data/mockCollections';

const NewCollectionModal = ({ isOpen, onClose, onAddCollection, onUpdateCollection, collectionToEdit }) => {
  const [date, setDate] = useState('');
  const [wasteType, setWasteType] = useState(wasteTypes[0]);
  const [amount, setAmount] = useState(0);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (collectionToEdit) {
      setDate(collectionToEdit.date);
      setWasteType(collectionToEdit.wasteType);
      setAmount(collectionToEdit.amount);
      setLocation(collectionToEdit.location);
      setNotes(collectionToEdit.notes);
    } else {
      setDate('');
      setWasteType(wasteTypes[0]);
      setAmount(0);
      setLocation('');
      setNotes('');
    }
  }, [collectionToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const collectionData = { date, wasteType, amount, location, notes };
    if (collectionToEdit) {
      onUpdateCollection({ ...collectionToEdit, ...collectionData });
    } else {
      onAddCollection({ ...collectionData, status: 'Scheduled', id: Date.now() });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{collectionToEdit ? 'Edit Collection' : 'Log a New Collection'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Waste Type</label>
            <select value={wasteType} onChange={(e) => setWasteType(e.target.value)} className="w-full p-2 border rounded">
              {wasteTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Amount (kg)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full p-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 border rounded"></textarea>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded mr-2">Cancel</button>
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">{collectionToEdit ? 'Update Collection' : 'Add Collection'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewCollectionModal;
