import React from 'react';
import { MATURITY_ITEMS } from '../constants';
import { MaturityState } from '../types';
import { BarChart3, Info } from 'lucide-react';

interface Props {
  data: MaturityState;
  onChange: (id: string, value: number) => void;
}

export const MaturityTool: React.FC<Props> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="text-blue-600" />
          <h2 className="text-xl font-bold text-slate-800">
            Maturidade em Cultura de Segurança (GRO)
          </h2>
        </div>

        <div className="grid gap-8">
          {MATURITY_ITEMS.map((item) => {
            const currentValue = data[item.id] || 0;
            return (
              <div key={item.id} className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                <div className="mb-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-slate-800 text-lg">{item.dimension}</h3>
                    <div className="group relative">
                        <Info size={16} className="text-slate-400 cursor-help" />
                        <div className="absolute right-0 w-64 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {item.description}
                        </div>
                    </div>
                  </div>
                  <p className="text-slate-600 mt-1">{item.question}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-slate-400 uppercase">
                    <span>Inicial (1)</span>
                    <span>Avançado (5)</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => onChange(item.id, level)}
                        className={`flex-1 h-12 rounded-md font-bold transition-all ${
                          currentValue === level
                            ? 'bg-blue-600 text-white shadow-lg scale-105'
                            : currentValue > level
                            ? 'bg-blue-100 text-blue-300'
                            : 'bg-white border border-slate-200 text-slate-400 hover:border-blue-300'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                     <span className="text-xs text-slate-500">
                        Nível Selecionado: 
                        <span className="font-bold ml-1 text-slate-700">
                            {currentValue === 0 ? '-' : currentValue}
                        </span>
                     </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
