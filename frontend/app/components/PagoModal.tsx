// app/components/PagoModal.tsx
'use client';

import { useState } from 'react';
import { CreditCard, Smartphone, Building, Lock, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface PagoModalProps {
    isOpen: boolean;
    onClose: () => void;
    ventaId: number;
    total: number;
    onPagoExitoso: () => void;
}

export function PagoModal({ isOpen, onClose, ventaId, total, onPagoExitoso }: PagoModalProps) {
    const [metodoPago, setMetodoPago] = useState<'tarjeta' | 'transferencia' | 'movil'>('tarjeta');
    const [isProcessing, setIsProcessing] = useState(false);
    const [formData, setFormData] = useState({
        // Tarjeta
        numeroTarjeta: '',
        nombreTitular: '',
        fechaExpiracion: '',
        cvv: '',
        // Transferencia
        banco: '',
        numeroReferencia: '',
        // Móvil
        telefono: '',
        proveedor: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        // Simular procesamiento de pago
        setTimeout(() => {
            setIsProcessing(false);
            toast.success('¡Pago realizado exitosamente!');
            onPagoExitoso();
            onClose();
        }, 2000);
    };

    const getTotalEnPalabras = (total: number) => {
        const partes = total.toFixed(2).split('.');
        const enteros = parseInt(partes[0]);
        const centavos = parseInt(partes[1]);
        
        return `${enteros} bolivianos con ${centavos} centavos`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Realizar Pago</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <p className="text-sm text-gray-600">Venta #{ventaId}</p>
                        <p className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">{getTotalEnPalabras(total)}</p>
                    </div>

                    {/* Métodos de Pago */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Selecciona método de pago
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setMetodoPago('tarjeta')}
                                className={`p-3 border-2 rounded-lg text-center transition-all ${
                                    metodoPago === 'tarjeta'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <CreditCard className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                                <p className="text-xs">Tarjeta</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMetodoPago('transferencia')}
                                className={`p-3 border-2 rounded-lg text-center transition-all ${
                                    metodoPago === 'transferencia'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <Building className="h-5 w-5 mx-auto mb-1 text-green-600" />
                                <p className="text-xs">Transferencia</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMetodoPago('movil')}
                                className={`p-3 border-2 rounded-lg text-center transition-all ${
                                    metodoPago === 'movil'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <Smartphone className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                                <p className="text-xs">Pago Móvil</p>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {metodoPago === 'tarjeta' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Número de Tarjeta
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="**** **** **** ****"
                                        value={formData.numeroTarjeta}
                                        onChange={(e) => setFormData({ ...formData, numeroTarjeta: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre del Titular
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Como aparece en la tarjeta"
                                        value={formData.nombreTitular}
                                        onChange={(e) => setFormData({ ...formData, nombreTitular: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Fecha Expiración
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="MM/AA"
                                            value={formData.fechaExpiracion}
                                            onChange={(e) => setFormData({ ...formData, fechaExpiracion: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            CVV
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="***"
                                            value={formData.cvv}
                                            onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {metodoPago === 'transferencia' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Banco
                                    </label>
                                    <select
                                        value={formData.banco}
                                        onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Selecciona un banco</option>
                                        <option value="banco_union">Banco Unión</option>
                                        <option value="bisa">Banco BISA</option>
                                        <option value="mercantil">Banco Mercantil Santa Cruz</option>
                                        <option value="nacional">Banco Nacional de Bolivia</option>
                                        <option value="economico">Banco Económico</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Número de Referencia
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Número de transacción"
                                        value={formData.numeroReferencia}
                                        onChange={(e) => setFormData({ ...formData, numeroReferencia: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-xs text-blue-800">
                                        <strong>Datos bancarios:</strong><br />
                                        Banco Unión<br />
                                        Cuenta: 1-234567-89<br />
                                        Beneficiario: Ecommerce Seguro SRL<br />
                                        NIT: 123456789
                                    </p>
                                </div>
                            </>
                        )}

                        {metodoPago === 'movil' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Número de Teléfono
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="6XXXXXXX"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Proveedor
                                    </label>
                                    <select
                                        value={formData.proveedor}
                                        onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Selecciona un proveedor</option>
                                        <option value="tigo">Tigo Money</option>
                                        <option value="viva">Viva QR</option>
                                        <option value="entel">Entel Pago</option>
                                    </select>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-lg">
                                    <p className="text-xs text-purple-800">
                                        <strong>Código QR:</strong><br />
                                        Escanea el código QR desde tu aplicación de pagos móviles.
                                    </p>
                                </div>
                            </>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex items-center text-sm text-gray-500">
                                <Lock className="h-4 w-4 mr-1" />
                                Pago seguro
                            </div>
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {isProcessing ? 'Procesando...' : `Pagar $${total.toFixed(2)}`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}