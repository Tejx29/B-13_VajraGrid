import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, MapPin, Truck, Shield, Filter } from 'lucide-react';
import { MockAPI } from '../../services/mockApi';

export function Coordination() {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [vols, res] = await Promise.all([
          MockAPI.getVolunteers(),
          MockAPI.getResources()
        ]);
        setVolunteers(vols);
        setResources(res);
      } catch (error) {
        console.error('Failed to load coordination data', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#26211C] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F0EB]">Dispatch & Communications</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#F5A23A]/15 text-[#F5A23A] border border-[#F5A23A]/40">
              EOC TACTICAL RELAY
            </span>
          </div>
          <p className="text-sm font-medium text-[#AAA29A]">Coordinate field dispatch channels, mobile volunteer units, and supply asset convoys.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 bg-[#27211B] hover:bg-[#342c24] text-[#F4F0EB] border-[#38302A] text-xs">
            <Truck className="h-4 w-4 text-[#F5A23A]" />
            Dispatch Convoy
          </Button>
          <Button className="gap-2 bg-[#F5A23A] hover:bg-[#f6ab4e] text-stone-950 font-semibold shadow-xs text-xs">
            <Shield className="h-4 w-4" />
            Mobilize Tactical Team
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Volunteers Panel */}
        <Card className="border border-[#38302A] bg-[#191715] rounded-xl overflow-hidden shadow-sm">
          <CardHeader className="p-4 sm:p-5 border-b border-[#26211C] bg-[#12110F]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-[#AAA29A]">Active Personnel Units</CardTitle>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#27211B] text-[#AAA29A] border border-[#38302A]">
                {volunteers.length} Active
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7C756E]" />
                <Input placeholder="Search personnel..." className="pl-9 h-8 text-xs bg-[#191715] border-[#38302A] text-[#F4F0EB]" />
              </div>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0 bg-[#27211B] border-[#38302A] text-[#AAA29A]">
                <Filter className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-[#AAA29A] text-xs animate-pulse">Loading personnel...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#12110F]">
                      <TableHead>Responder</TableHead>
                      <TableHead>Role / Skills</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {volunteers.map((vol) => (
                      <TableRow key={vol.id} className="hover:bg-[#27211B]/60 transition-colors">
                        <TableCell className="font-medium text-[#F4F0EB]">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-[#27211B] border border-[#38302A] text-[#F5A23A] flex items-center justify-center text-[10px] font-bold font-mono">
                              {vol.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <span className="text-xs font-semibold text-[#F4F0EB]">{vol.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {vol.skills.map((skill: string) => (
                              <span key={skill} className="text-[10px] font-mono bg-[#27211B] text-[#AAA29A] px-1.5 py-0.5 rounded border border-[#38302A]">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border capitalize ${
                            vol.status === 'available' ? 'bg-[#16B58A]/15 text-[#16B58A] border-[#16B58A]/40' :
                            vol.status === 'assigned' ? 'bg-blue-500/15 text-blue-400 border-blue-500/40' :
                            vol.status === 'deployed' ? 'bg-[#F46B27]/15 text-[#F46B27] border-[#F46B27]/40' :
                            'bg-[#27211B] text-[#AAA29A] border-[#38302A]'
                          }`}>
                            {vol.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.location.href = '/admin/volunteers'}
                            className="h-7 text-xs bg-[#27211B] hover:bg-[#342c24] text-[#F4F0EB] border-[#38302A] cursor-pointer"
                          >
                            Manage
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

        {/* Resources Panel */}
        <Card className="border border-[#38302A] bg-[#191715] rounded-xl overflow-hidden shadow-sm">
          <CardHeader className="p-4 sm:p-5 border-b border-[#26211C] bg-[#12110F]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider font-mono text-[#AAA29A]">Supply Logistics & Fleets</CardTitle>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#27211B] text-[#AAA29A] border border-[#38302A]">
                {resources.length} Assets
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7C756E]" />
                <Input placeholder="Search resources..." className="pl-9 h-8 text-xs bg-[#191715] border-[#38302A] text-[#F4F0EB]" />
              </div>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0 bg-[#27211B] border-[#38302A] text-[#AAA29A]">
                <Filter className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-[#AAA29A] text-xs animate-pulse">Loading resources...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#12110F]">
                      <TableHead>Resource</TableHead>
                      <TableHead>Depot Location</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resources.map((res) => (
                      <TableRow key={res.id} className="hover:bg-[#27211B]/60 transition-colors">
                        <TableCell>
                          <p className="font-semibold text-xs text-[#F4F0EB]">{res.name}</p>
                          <p className="text-[10px] text-[#7C756E] font-mono capitalize">{res.type}</p>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-xs text-[#AAA29A]">
                            <MapPin className="h-3 w-3 text-[#F5A23A]" /> {res.location?.address || 'Palghar Central Depot'}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-[#F5A23A]">
                          {res.quantity}
                        </TableCell>
                        <TableCell>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border capitalize ${
                            res.status === 'Available' || res.status === 'available' ? 'bg-[#16B58A]/15 text-[#16B58A] border-[#16B58A]/40' :
                            res.status === 'In Transit' || res.status === 'in_transit' ? 'bg-[#F5A23A]/15 text-[#F5A23A] border-[#F5A23A]/40' :
                            'bg-[#F46B27]/15 text-[#F46B27] border-[#F46B27]/40'
                          }`}>
                            {res.status}
                          </span>
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
    </div>
  );
}
