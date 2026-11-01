import React, { useState } from 'react';
import { X, Package, Loader2, Plus, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MockAPI } from '../../services/mockApi';
import { Resource, ResourceCategory } from '../../types';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (resource: Resource) => void;
}

const CATEGORIES: { value: ResourceCategory; label: string }[] = [
  { value: 'Ambulance', label: 'Ambulance / Medical Transport' },
  { value: 'Rescue Boat', label: 'Rescue Boat / Marine Unit' },
  { value: 'Medical Kit', label: 'Medical Kit / Trauma Supplies' },
  { value: 'Food', label: 'Food / Emergency Rations' },
  { value: 'Water', label: 'Drinking Water / Potable Tanker' },
  { value: 'Rescue Equipment', label: 'Rescue Equipment / Dewatering Pump' },
  { value: 'Vehicle', label: 'Heavy Vehicle / Excavator' }
];

const PRESET_DEPOTS = [
  { address: 'Palghar Central Depot, Palghar', lat: 19.6967, lng: 72.7699 },
  { address: 'Civil Hospital Depot, Palghar', lat: 19.6970, lng: 72.7680 },
  { address: 'Dahanu Coastal Jetty Base', lat: 19.9750, lng: 72.7290 },
  { address: 'PWD Logistics Depot, Manor', lat: 19.7400, lng: 72.9050 },
  { address: 'Boisar MIDC Fire Depot', lat: 19.8030, lng: 72.7560 },
  { address: 'Jawhar Tribal Sub-Division Depot', lat: 19.9050, lng: 73.2320 }
];

export function AddResourceModal({ isOpen, onClose, onSuccess }: AddResourceModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('Medical Kit');
  const [quantity, setQuantity] = useState('1');
  const [depotAddress, setDepotAddress] = useState(PRESET_DEPOTS[0].address);
  const [customAddress, setCustomAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Asset name is required.');
      return;
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty < 1) {
      setErrorMessage('Quantity must be a positive whole number (at least 1).');
      return;
    }

    const isCustom = depotAddress === 'custom';
    const finalAddress = isCustom ? customAddress.trim() : depotAddress;
    if (isCustom && !finalAddress) {
      setErrorMessage('Please enter the custom depot address.');
      return;
    }

    const selectedDepot = PRESET_DEPOTS.find(d => d.address === depotAddress);
    const lat = selectedDepot ? selectedDepot.lat : 19.6967;
    const lng = selectedDepot ? selectedDepot.lng : 72.7699;

    setIsSubmitting(true);
    try {
      const created = await MockAPI.addResource({
        name: trimmedName,
        type: category,
        quantity: parsedQty,
        location: {
          lat,
          lng,
          address: finalAddress
        },
        status: 'Available'
      });

      // Reset form
      setName('');
      setCategory('Medical Kit');
      setQuantity('1');
      setDepotAddress(PRESET_DEPOTS[0].address);
      setCustomAddress('');

      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to register resource asset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-[#12110F] border border-[#38302A] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] text-[#F4F0EB] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#26211C] bg-[#12110F]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#27211B] border border-[#38302A] text-[#F5A23A]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F4F0EB]">Register Resource Asset</h2>
              <p className="text-xs text-[#AAA29A]">Add stockpile supply or vehicle to Palghar inventory</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#AAA29A] hover:text-[#F4F0EB] hover:bg-[#27211B] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-[#E53935]/10 border border-[#E53935]/40 rounded-xl text-xs text-[#FF8A80] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#FF8A80] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#AAA29A]">
              Asset Name <span className="text-[#F5A23A]">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Dahanu High-Capacity Dewatering Pump 02"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#191715] border-[#38302A] text-[#F4F0EB] text-xs h-9 focus:border-[#F5A23A]"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Category & Quantity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#AAA29A]">
                Resource Category <span className="text-[#F5A23A]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                className="w-full h-9 rounded-lg border border-[#38302A] bg-[#191715] px-3 text-xs font-medium text-[#F4F0EB] outline-none focus:border-[#F5A23A] cursor-pointer"
                disabled={isSubmitting}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#AAA29A]">
                Quantity / Units <span className="text-[#F5A23A]">*</span>
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-[#191715] border-[#38302A] text-[#F4F0EB] text-xs h-9 focus:border-[#F5A23A] font-mono"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Storage Depot Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#AAA29A]">
              Storage Depot / Facility Base <span className="text-[#F5A23A]">*</span>
            </label>
            <select
              value={depotAddress}
              onChange={(e) => setDepotAddress(e.target.value)}
              className="w-full h-9 rounded-lg border border-[#38302A] bg-[#191715] px-3 text-xs font-medium text-[#F4F0EB] outline-none focus:border-[#F5A23A] cursor-pointer"
              disabled={isSubmitting}
            >
              {PRESET_DEPOTS.map(depot => (
                <option key={depot.address} value={depot.address}>
                  {depot.address}
                </option>
              ))}
              <option value="custom">+ Custom Depot Address...</option>
            </select>
          </div>

          {depotAddress === 'custom' && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="text-xs font-semibold text-[#AAA29A]">
                Custom Depot Address &amp; Sector <span className="text-[#F5A23A]">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Talasari Civil Storage Unit, Talasari"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className="bg-[#191715] border-[#38302A] text-[#F4F0EB] text-xs h-9 focus:border-[#F5A23A]"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Initial Status info note */}
          <div className="p-3 rounded-xl bg-[#27211B] border border-[#38302A] flex items-center justify-between text-xs">
            <span className="text-[#AAA29A]">Initial Depot Status:</span>
            <span className="font-mono font-bold text-[#16B58A] bg-[#16B58A]/10 px-2 py-0.5 rounded border border-[#16B58A]/30">
              Available
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#26211C]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="bg-[#191715] hover:bg-[#27211B] text-[#AAA29A] hover:text-[#F4F0EB] border-[#38302A] text-xs h-9 px-4 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-bold text-xs h-9 px-4 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Stockpile</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
