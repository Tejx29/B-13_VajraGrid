import React, { useEffect, useState } from 'react';
import { Package, Truck, Search, Plus, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { MockAPI } from '../../services/mockApi';
import { Resource } from '../../types';

export function AuthorityResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    async function loadResources() {
      try {
        const data = await MockAPI.getResources();
        setResources(data);
      } catch (err) {
        console.error('Failed to load resources', err);
      } finally {
        setLoading(false);
      }
    }
    loadResources();
  }, []);

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || r.type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const availableCount = resources.filter(r => r.status === 'Available').length;
  const allocatedCount = resources.filter(r => r.status === 'Allocated' || r.status === 'In Use').length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#26211C] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0EB]">
              Humanitarian Aid & Resource Stockpiles
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#F5A23A]/15 text-[#F5A23A] border border-[#F5A23A]/40">
              PALGHAR DISTRICT DEPOTS
            </span>
          </div>
          <p className="text-sm text-[#AAA29A] font-medium">
            Emergency assets, fleet dispatch, ration depots, water tankers, and relief supply stockpile inventory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2 bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 shadow-xs font-semibold">
            <Plus className="h-4 w-4" />
            Add Resource Asset
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Total Assets Tracked</p>
              <p className="text-2xl font-bold text-[#F4F0EB] mt-1">{resources.length}</p>
              <p className="text-xs text-[#AAA29A] mt-0.5">Across district warehouses</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#27211B] border border-[#38302A] text-[#F5A23A] flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Available in Depot</p>
              <p className="text-2xl font-bold text-[#16B58A] mt-1">{availableCount}</p>
              <p className="text-xs text-[#AAA29A] mt-0.5">Ready for immediate dispatch</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#27211B] border border-[#38302A] text-[#16B58A] flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#191715] border-[#38302A] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono font-bold text-[#7C756E] uppercase tracking-wider">Deployed / In Use</p>
              <p className="text-2xl font-bold text-[#F46B27] mt-1">{allocatedCount}</p>
              <p className="text-xs text-[#AAA29A] mt-0.5">Assigned to active rescue zones</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#27211B] border border-[#38302A] text-[#F46B27] flex items-center justify-center">
              <Truck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Inventory Table */}
      <Card className="bg-[#191715] border-[#38302A] shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-[#26211C] bg-[#12110F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-[#AAA29A]">District Equipment & Relief Stocks</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C756E]" />
              <Input
                placeholder="Search asset or category..."
                className="pl-9 h-9 text-xs bg-[#12110F] border-[#38302A] text-[#F4F0EB]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="h-9 rounded-lg border border-[#38302A] bg-[#12110F] px-3 text-xs font-semibold text-[#F4F0EB] outline-none focus:border-[#F5A23A] cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Ambulance">Ambulance</option>
              <option value="Rescue Boat">Rescue Boat</option>
              <option value="Medical Kit">Medical Kit</option>
              <option value="Food">Food / Rations</option>
              <option value="Water">Drinking Water</option>
              <option value="Rescue Equipment">Rescue Equipment</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-[#AAA29A] text-sm animate-pulse">Loading district resources...</div>
          ) : filteredResources.length === 0 ? (
            <div className="py-16 text-center text-[#7C756E] text-sm">No resources found matching filter criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#12110F]">
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock / Quantity</TableHead>
                    <TableHead>Storage Depot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.map(r => (
                    <TableRow key={r.id} className="hover:bg-[#27211B]/60 transition-colors">
                      <TableCell className="font-medium text-[#F4F0EB]">
                        <div>
                          <p className="font-semibold text-[#F4F0EB] text-xs">{r.name}</p>
                          <p className="text-[10px] text-[#7C756E] font-mono">ID: {r.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#27211B] text-[#AAA29A] border border-[#38302A]">
                          {r.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-[#F5A23A]">
                        {r.quantity ? `${r.quantity} units` : '1 Unit'}
                      </TableCell>
                      <TableCell className="text-xs text-[#AAA29A]">
                        {r.location?.address || 'Palghar Central Depot'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded border capitalize ${
                            r.status === 'Available'
                              ? 'bg-[#16B58A]/15 text-[#16B58A] border-[#16B58A]/40'
                              : 'bg-[#F46B27]/15 text-[#F46B27] border-[#F46B27]/40'
                          }`}
                        >
                          {r.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs bg-[#27211B] hover:bg-[#342c24] text-[#F4F0EB] border-[#38302A] h-8"
                        >
                          Allocate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
