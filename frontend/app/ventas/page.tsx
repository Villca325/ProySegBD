/* eslint-disable react-hooks/immutability */
// app/ventas/page.tsx (actualizado con funcionalidad de pago)
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { api } from "@/app/services/api";
import { Venta } from "@/app/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Package,
  CheckCircle,
  Truck,
  Clock,
  XCircle,
  Eye,
  CreditCard,
} from "lucide-react";
import { PagoModal } from "@/app/components/PagoModal";
import toast from "react-hot-toast";

export default function VentasPage() {
  const { user, hasRole } = useAuth();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [ventaPago, setVentaPago] = useState<{
    id: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    fetchVentas();
  }, []);

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const response = await api.getVentas();
      if (response.success) {
        setVentas(response.data.data);
        console.log(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching ventas:", error);
      toast.error("Error al cargar ventas");
    } finally {
      setLoading(false);
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "pagado":
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      case "enviado":
        return <Truck className="h-5 w-5 text-purple-500" />;
      case "entregado":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelado":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "pagado":
        return "bg-blue-100 text-blue-800";
      case "enviado":
        return "bg-purple-100 text-purple-800";
      case "entregado":
        return "bg-green-100 text-green-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "Pendiente de Pago";
      case "pagado":
        return "Pagado";
      case "enviado":
        return "Enviado";
      case "entregado":
        return "Entregado";
      case "cancelado":
        return "Cancelado";
      default:
        return estado;
    }
  };

  const puedePagar = (estado: string) => {
    return estado === "pendiente" && user?.rol === "cliente";
  };

  const puedeActualizarEstado = () => {
    return hasRole(["vendedor", "gerente", "admin"]);
  };

  const handlePagar = (venta: Venta) => {
    setVentaPago({ id: venta.id, total: parseFloat(venta.total) });
    setShowPagoModal(true);
  };

  const handlePagoExitoso = async () => {
    await fetchVentas();
    toast.success(
      "Pago registrado. El estado de tu compra ha sido actualizado.",
    );
  };

  const handleVerDetalle = async (id: number) => {
    try {
      const response = await api.getVenta(id);
      if (response.success) {
        setSelectedVenta(response.data);
        setShowModal(true);
      }
    } catch (error) {
      toast.error("Error al obtener detalle de la venta");
    }
  };

  const handleActualizarEstado = async (id: number, nuevoEstado: string) => {
    try {
      const response = await api.actualizarEstadoVenta(id, nuevoEstado);
      if (response.success) {
        toast.success("Estado actualizado exitosamente");
        fetchVentas();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Error al actualizar estado",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.rol === "cliente" ? "Mis Compras" : "Ventas"}
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.rol === "cliente"
              ? "Historial de tus compras realizadas"
              : "Gestión de ventas de productos"}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div> */}
          </div>
        ) : ventas.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay ventas registradas</p>
            {user?.rol === "cliente" && (
              <button
                onClick={() => (window.location.href = "/productos")}
                className="mt-4 inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Package className="h-5 w-5" />
                <span>Ver Productos</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {ventas.map((venta) => (
              <div
                key={user?.rol !== "cliente" ? venta.venta_id : venta.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Venta # {venta?.venta_id || venta.id}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(
                          new Date(venta.fecha),
                          "dd 'de' MMMM 'de' yyyy, HH:mm",
                          { locale: es },
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(venta.estado)}`}
                      >
                        {getEstadoIcon(venta.estado)}
                        <span>{getEstadoTexto(venta.estado)}</span>
                      </div>
                      {puedeActualizarEstado() && (
                        <select
                          value={venta.estado}
                          onChange={(e) =>
                            handleActualizarEstado(
                              venta?.venta_id || venta.id,
                              e.target.value,
                            )
                          }
                          className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="pagado">Pagado</option>
                          <option value="enviado">Enviado</option>
                          <option value="entregado">Entregado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {!isNaN(venta.total)
                            ? venta.total
                            : venta.venta_total}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {!isNaN(venta.total)
                            ? venta.total / venta.precio_unitario
                            : venta.venta_total / venta.precio_unitario}{" "}
                          producto(s)
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {puedePagar(venta.estado) && (
                          <button
                            onClick={() => handlePagar(venta)}
                            className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                          >
                            <CreditCard className="h-4 w-4" />
                            <span>Pagar</span>
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleVerDetalle(venta?.venta_id || venta.id)
                          }
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 px-3 py-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Ver detalle</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      {showModal && selectedVenta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  Detalle de Venta #{" "}
                  {selectedVenta?.venta_id || selectedVenta.id}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="font-medium">
                    {format(
                      new Date(selectedVenta.fecha),
                      "dd 'de' MMMM 'de' yyyy, HH:mm",
                      { locale: es },
                    )}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Estado</p>
                  <div
                    className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(selectedVenta.estado)}`}
                  >
                    {getEstadoIcon(selectedVenta.estado)}
                    <span>{getEstadoTexto(selectedVenta.estado)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Productos</h3>

                  <div className="space-y-2">
                    {selectedVenta.detalles?.map((detalle) => (
                      <div
                        key={detalle.id}
                        className="flex justify-between items-center border-b border-gray-200 py-2"
                      >
                        {console.log(detalle.data)}
                        <div>
                          <p className="font-medium">
                            {detalle.producto_nombre ||
                              `Producto #${detalle.producto_id}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {detalle.cantidad} x $
                            {detalle.precio_unitario.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold">
                          ${detalle.subtotal.toFixed(2)}
                        </p>
                      </div>
                    ))}
                    {(user?.rol === "cliente" || user?.rol === "vendedor") && (
                      <>
                        {console.log(selectedVenta)}
                        <div
                          key={selectedVenta.id??selectedVenta.venta_id}
                          className="flex justify-between items-center border-b border-gray-200 py-2"
                        >
                          <div>
                            <p className="font-medium">
                              {selectedVenta.producto_nombre ||
                                `Producto #${selectedVenta.producto_id}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {selectedVenta.cantidad} x $
                              {parseFloat(selectedVenta.precio_unitario).toFixed(2)}
                            </p>
                          </div>
                          <p className="font-semibold">
                            ${parseFloat(selectedVenta.subtotal).toFixed(2)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold">Total</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${!isNaN(parseFloat(selectedVenta.total))?parseFloat(selectedVenta.total).toFixed(2):parseFloat(selectedVenta.venta_total).toFixed(2)}
                    </p>
                  </div>
                </div>

                {selectedVenta.estado === "pendiente" &&
                  user?.rol === "cliente" && (
                    <div className="pt-4">
                      <button
                        onClick={() => {
                          setShowModal(false);
                          handlePagar(selectedVenta);
                        }}
                        className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        <CreditCard className="h-5 w-5" />
                        <span>Proceder al Pago</span>
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pago */}
      {ventaPago && (
        <PagoModal
          isOpen={showPagoModal}
          onClose={() => {
            setShowPagoModal(false);
            setVentaPago(null);
          }}
          ventaId={ventaPago.id}
          total={ventaPago.total}
          onPagoExitoso={handlePagoExitoso}
        />
      )}
    </div>
  );
}
