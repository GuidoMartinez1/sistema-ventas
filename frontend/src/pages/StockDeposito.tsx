import { useEffect, useState, useMemo, useCallback } from 'react';
// 💡 Importamos la interfaz Traslado
import { stockDepositoAPI, StockDeposito, LoteDeposito, Traslado } from '../services/api';
import toast from 'react-hot-toast';
import { Package, Warehouse, Calendar, ArrowRight, X, Loader2, Maximize2, FileText, LayoutList } from 'lucide-react';

// Tipos para el selector de pestañas
type Vista = 'deposito' | 'reporte';

// Clases de utilidad
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out text-sm";
const formatDate = (dateString: string | undefined, includeTime: boolean = false) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: includeTime ? '2-digit' : undefined,
        minute: includeTime ? '2-digit' : undefined
    });
};

// FUNCIÓN PARA MOSTRAR KILOS (Sin .00 si es entero, con .00 si no)
const formatKilos = (kilos: number | undefined | string) => {
    if (kilos == null || kilos === '' || Number(kilos) <= 0) return '-';

    const kiloValue = Number(kilos);

    if (Number.isInteger(kiloValue)) {
        return kiloValue.toString();
    }
    return kiloValue.toFixed(2);
};

// FUNCIÓN PARA FORMATEAR NÚMEROS GRANDES (ej: 1,234.50)
const formatNumber = (value: number) => {
    if (value === null || value === undefined) return '0';
    return Number(value).toLocaleString("es-AR", { maximumFractionDigits: 2 });
};

// ====================================================================
// 💡 NUEVO COMPONENTE: VISTA DE REPORTES
// ====================================================================
interface ReportesTrasladoProps {
    reporteList: Traslado[];
    loadingReporte: boolean;
}

const ReportesTraslado: React.FC<ReportesTrasladoProps> = ({ reporteList, loadingReporte }) => {
    if (loadingReporte) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <p className="ml-3 text-gray-600">Cargando reportes...</p>
            </div>
        );
    }

    if (reporteList.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                Aún no se ha registrado ninguna transferencia entre Depósito y Tienda.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unidades</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Peso Total (Kg)</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {reporteList.map((traslado) => {
                    const kilosPorUnidad = Number(traslado.kilos_por_unidad) || 0;
                    const cantidad = Number(traslado.cantidad_movida) || 0;
                    const pesoTotal = kilosPorUnidad * cantidad;

                    return (
                        <tr key={traslado.id} className="hover:bg-gray-50">
                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {traslado.producto_nombre}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-semibold">
                                {cantidad} uds
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-gray-800 font-semibold">
                                {formatKilos(pesoTotal)} kg
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                {formatDate(traslado.fecha_traslado, true)}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

// ====================================================================
// COMPONENTE PRINCIPAL StockDeposito
// ====================================================================

const StockDeposito = () => {
    // 💡 NUEVO ESTADO DE PESTAÑA Y REPORTE
    const [vistaActual, setVistaActual] = useState<Vista>('deposito');
    const [reporteList, setReporteList] = useState<Traslado[]>([]);
    const [loadingReporte, setLoadingReporte] = useState(false);

    // ESTADO PRINCIPAL DE DATOS
    const [stockList, setStockList] = useState<StockDeposito[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<StockDeposito | null>(null);
    const [lotes, setLotes] = useState<LoteDeposito[]>([]);
    const [isTransferring, setIsTransferring] = useState(false);

    // ESTADOS PARA TRASLADO MASIVO
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [isMassTransferring, setIsMassTransferring] = useState(false);

    const [cantidadInput, setCantidadInput] = useState<number | string>('');
    const [modoTransferencia, setModoTransferencia] = useState<'trasladar' | 'quedar'>('trasladar');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await stockDepositoAPI.getAll();
            const safeStockList = response.data.map((item: StockDeposito) => ({
                ...item,
                stock_en_deposito: Number(item.stock_en_deposito) || 0,
                kilos: Number(item.kilos) || 0,
            }));
            setStockList(safeStockList);
        } catch {
            toast.error('Error al cargar el stock del depósito.');
        } finally {
            setLoading(false);
        }
    }, []);

    // 💡 FUNCIÓN: Llama al endpoint getReporteTraslados
    const fetchReporte = useCallback(async () => {
        setLoadingReporte(true);
        try {
            const response = await stockDepositoAPI.getReporteTraslados(); // 👈 CONSUMO DEL ENDPOINT
            setReporteList(response.data);
        } catch {
            toast.error('Error al cargar el reporte de traslados.');
            setReporteList([]);
        } finally {
            setLoadingReporte(false);
        }
    }, []);

    useEffect(() => {
        if (vistaActual === 'deposito') {
            fetchData();
        } else {
            // Llama al reporte solo si la pestaña actual es 'reporte'
            fetchReporte();
        }
    }, [fetchData, fetchReporte, vistaActual]); // Depende de la vistaActual

    const filteredStock = useMemo(() => {
        return stockList.filter(item =>
            item.producto_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            item.codigo?.toLowerCase().includes(busqueda.toLowerCase())
        );
    }, [stockList, busqueda]);

    // CÁLCULOS DE KILOS Y STOCK TOTALES
    const totalWeightInDeposito = useMemo(() => {
        return stockList.reduce((sum, item) => {
            const kilosPorUnidad = Number(item.kilos) || 0;
            const stock = Number(item.stock_en_deposito) || 0;
            return sum + (kilosPorUnidad * stock);
        }, 0);
    }, [stockList]);

    const totalStockInDeposito = useMemo(() => {
        return stockList.reduce((sum, item) => sum + (Number(item.stock_en_deposito) || 0), 0);
    }, [stockList]);

    const totalSelectedStock = useMemo(() => {
        return stockList.reduce((sum, item) => {
            if (selectedItems.has(item.producto_id)) {
                return sum + (Number(item.stock_en_deposito) || 0);
            }
            return sum;
        }, 0);
    }, [stockList, selectedItems]);

    const totalSelectedWeight = useMemo(() => {
        return stockList.reduce((sum, item) => {
            if (selectedItems.has(item.producto_id)) {
                const kilosPorUnidad = Number(item.kilos) || 0;
                const stock = Number(item.stock_en_deposito) || 0;
                return sum + (kilosPorUnidad * stock);
            }
            return sum;
        }, 0);
    }, [stockList, selectedItems]);

    const handleSelectItem = (productId: number) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const totalFilteredItemsWithStock = filteredStock.filter(item => Number(item.stock_en_deposito) > 0).length;

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allProductIdsWithStock = new Set(
                filteredStock
                    .filter(item => Number(item.stock_en_deposito) > 0)
                    .map(item => item.producto_id)
            );
            setSelectedItems(allProductIdsWithStock);
        } else {
            setSelectedItems(new Set());
        }
    };


    const handleOpenModal = async (product: StockDeposito) => {
        setSelectedProduct(product);
        setShowModal(true);
        setCantidadInput('');
        setModoTransferencia('trasladar');
        try {
            const lotesResponse = await stockDepositoAPI.getLotes(product.producto_id);
            setLotes(lotesResponse.data);
        } catch {
            toast.error('Error al cargar el detalle de lotes.');
            setLotes([]);
        }
    };

    const handleMassTransferAll = async () => {
        if (totalStockInDeposito <= 0) {
            return toast.error("El depósito ya está vacío. No hay stock para trasladar.");
        }

        if (!window.confirm(`⚠️ ADVERTENCIA: Esta acción trasladará TODO el stock de TODOS los productos (${totalStockInDeposito} unidades en total) del depósito a la tienda, dejando el depósito en 0. ¿Confirmar?`)) {
            return;
        }

        const itemsToTransfer = stockList.filter(item => Number(item.stock_en_deposito) > 0);
        let successCount = 0;
        let failCount = 0;

        setIsMassTransferring(true);

        try {
            for (const item of itemsToTransfer) {
                const cantidadTotal = Number(item.stock_en_deposito);
                if (cantidadTotal > 0) {
                    try {
                        await stockDepositoAPI.transferir(item.producto_id, cantidadTotal);
                        successCount++;
                    } catch (error) {
                        failCount++;
                        console.error(`Error al trasladar ${item.producto_nombre}:`, error);
                    }
                }
            }

            if (successCount > 0) {
                toast.success(`Traslado masivo global completado: ${successCount} productos vaciados. ${failCount} errores.`);
                setSelectedItems(new Set());
            } else if (failCount > 0) {
                toast.error(`El traslado masivo falló para ${failCount} productos.`);
            } else {
                toast.success("Depósito ya vacío.");
            }

            await fetchData();

        } catch (error) {
            toast.error('Error crítico durante el proceso de traslado masivo.');
        } finally {
            setIsMassTransferring(false);
        }
    };

    const handleMassTransferSelected = async () => {
        if (selectedItems.size === 0) {
            return toast.error("No hay productos seleccionados para trasladar.");
        }
        if (totalSelectedStock === 0) {
            return toast.error("Los productos seleccionados no tienen stock en depósito.");
        }

        const count = selectedItems.size;

        if (!window.confirm(`⚠️ ADVERTENCIA: Esta acción trasladará TODO el stock de los ${count} productos seleccionados, vaciando su depósito (Total: ${formatNumber(totalSelectedStock)} uds. / ${formatNumber(totalSelectedWeight)} kg). ¿Confirmar?`)) {
            return;
        }

        const itemsToTransfer = stockList.filter(item => selectedItems.has(item.producto_id) && Number(item.stock_en_deposito) > 0);
        let successCount = 0;
        let failCount = 0;

        setIsMassTransferring(true);

        try {
            for (const item of itemsToTransfer) {
                const cantidadTotal = Number(item.stock_en_deposito);
                try {
                    await stockDepositoAPI.transferir(item.producto_id, cantidadTotal);
                    successCount++;
                } catch (error) {
                    failCount++;
                    console.error(`Error al trasladar ${item.producto_nombre}:`, error);
                }
            }

            if (successCount > 0) {
                toast.success(`Traslado masivo completado: ${successCount} de ${count} productos seleccionados vaciados.`);
                setSelectedItems(new Set());
            } else {
                toast.error(`El traslado masivo falló para todos los productos seleccionados (${failCount} errores).`);
            }

            await fetchData();

        } catch (error) {
            toast.error('Error crítico durante el proceso de traslado masivo.');
        } finally {
            setIsMassTransferring(false);
        }
    };


    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;

        let cantidadAMover = 0;
        const stockActual = Number(selectedProduct.stock_en_deposito);
        const inputNum = Number(cantidadInput);

        if (isNaN(inputNum) || (cantidadInput === '' && stockActual > 0)) {
            return toast.error("Debes ingresar una cantidad válida.");
        }

        if (modoTransferencia === 'trasladar') {
            if (inputNum <= 0) {
                return toast.error("La cantidad a trasladar debe ser mayor a cero.");
            }
            if (inputNum > stockActual) {
                return toast.error(`Error: Intentas trasladar más stock del que tienes en depósito (${stockActual}).`);
            }
            cantidadAMover = inputNum;
        } else {
            if (inputNum < 0) {
                return toast.error("La cantidad que queda no puede ser negativa.");
            }
            if (inputNum > stockActual) {
                return toast.error(`Error: No puedes dejar más stock del que tienes (${stockActual}).`);
            }
            cantidadAMover = stockActual - inputNum;
        }

        if (cantidadAMover <= 0) {
            if (stockActual > 0 && modoTransferencia === 'quedar' && inputNum === stockActual) {
                return toast.error("El stock ya está en su cantidad final. No hay unidades para trasladar.");
            }
            if (stockActual > 0) {
                return toast.error("La cantidad a mover debe ser mayor a cero.");
            }
            return toast.error("No hay stock para mover.");
        }

        setIsTransferring(true);
        try {
            await stockDepositoAPI.transferir(selectedProduct.producto_id, cantidadAMover);

            const vacioDeDeposito = cantidadAMover === stockActual;

            if (vacioDeDeposito) {
                toast.success(`Todo el stock (${cantidadAMover} unidades) de ${selectedProduct.producto_nombre} fue trasladado. Stock en depósito: 0.`);
            } else {
                toast.success(`Traslado de ${cantidadAMover} unidades de ${selectedProduct.producto_nombre} a la tienda registrado.`);
            }

            await fetchData();
            setShowModal(false);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Error desconocido al realizar la transferencia.';
            toast.error(errorMessage);
        } finally {
            setIsTransferring(false);
        }
    };

    const allFilteredItemsWithStockSelected = filteredStock
        .filter(item => Number(item.stock_en_deposito) > 0)
        .every(item => selectedItems.has(item.producto_id));

    if (loading && vistaActual === 'deposito') { // Solo muestra loading si está en la pestaña principal
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // ====================================================================
    // RENDERIZADO PRINCIPAL
    // ====================================================================

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto relative">

            {/* Botón Flotante para Traslado Masivo por Selección */}
            {vistaActual === 'deposito' && selectedItems.size > 0 && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                    <button
                        onClick={handleMassTransferSelected}
                        className="bg-orange-600 hover:bg-orange-600 text-white rounded-full text-base py-3 px-6 transition duration-150 ease-in-out font-semibold flex items-center shadow-2xl disabled:bg-gray-400"
                        disabled={isMassTransferring || totalSelectedStock === 0}>
                        {isMassTransferring ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                            <Maximize2 className="h-5 w-5 mr-2" />
                        )}
                        Vaciar Depósito de {selectedItems.size} {selectedItems.size === 1 ? 'Ítem Seleccionado' : 'Ítems Seleccionados'} ({formatNumber(totalSelectedStock)} uds. | {formatNumber(totalSelectedWeight)} kg)
                    </button>
                </div>
            )}

            {/* ENCABEZADO Y BOTÓN MAESTRO GLOBAL */}
            <div className="flex flex-wrap justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="min-w-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                        <Warehouse className="h-6 w-6 md:h-7 md:w-7 mr-2 text-orange-500" />
                        Stock en Depósito
                    </h1>
                    {vistaActual === 'deposito' && (
                        <p className="text-sm text-gray-600">Control de la mercadería almacenada ({formatNumber(totalStockInDeposito)} uds. | <span className="font-semibold text-orange-600">{formatNumber(totalWeightInDeposito)} kg</span>).</p>
                    )}
                    {vistaActual === 'reporte' && (
                        <p className="text-sm text-gray-600">Historial de todas las transferencias de Depósito a Tienda.</p>
                    )}
                </div>

                {/* Botón Maestro Trasladar Todo GLOBAL (Solo visible en la pestaña Depósito) */}
                {vistaActual === 'deposito' && (
                    <button
                        onClick={handleMassTransferAll}
                        className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto rounded-xl text-sm md:text-lg py-3 px-4 md:px-6 transition duration-150 ease-in-out font-semibold flex items-center justify-center shadow-lg hover:shadow-xl disabled:bg-gray-400 flex-shrink-0"
                        disabled={isMassTransferring || totalStockInDeposito === 0}>
                        {isMassTransferring ? (
                            <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin mr-2" />
                        ) : (
                            <Maximize2 className="h-5 w-5 md:h-6 md:w-6 mr-2" />
                        )}
                        {isMassTransferring ? 'Vaciando Depósito...' : `Vaciar Depósito Completo (${totalStockInDeposito} uds.)`}
                    </button>
                )}
            </div>

            {/* 💡 NAVEGACIÓN POR PESTAÑAS */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setVistaActual('deposito')}
                        className={`py-2 px-1 font-medium text-sm border-b-2 transition duration-150 ease-in-out flex items-center ${
                            vistaActual === 'deposito'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <LayoutList className="h-4 w-4 mr-2" /> Inventario Depósito
                    </button>
                    <button
                        onClick={() => setVistaActual('reporte')}
                        className={`py-2 px-1 font-medium text-sm border-b-2 transition duration-150 ease-in-out flex items-center ${
                            vistaActual === 'reporte'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <FileText className="h-4 w-4 mr-2" /> Reporte de Traslados
                    </button>
                </nav>
            </div>

            <div className={cardClass}>

                {vistaActual === 'deposito' && (
                    <>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Buscar producto por nombre o código..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                className={`${inputFieldClass} w-full`}/>
                        </div>

                        {filteredStock.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                {busqueda ? 'No se encontraron productos con ese criterio en el depósito.' : 'No hay stock registrado actualmente en el depósito.'}
                            </div>
                        ) : (
                            <>
                                {/* TABLA GRANDE (Desktop) */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                        <tr>
                                            {/* Nueva columna para Checkbox de selección masiva */}
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {totalFilteredItemsWithStock > 0 && (
                                                    <input
                                                        type="checkbox"
                                                        checked={totalFilteredItemsWithStock > 0 && allFilteredItemsWithStockSelected}
                                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                                        className="form-checkbox h-4 w-4 text-orange-600 rounded"
                                                        title="Seleccionar todos los productos visibles con stock"
                                                    />
                                                )}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Peso Total (Kg)</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Depósito</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Tienda</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredStock.map((item) => (
                                            <tr key={item.producto_id}>
                                                {/* Columna Checkbox */}
                                                <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                                                    {Number(item.stock_en_deposito) > 0 && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItems.has(item.producto_id)}
                                                            onChange={() => handleSelectItem(item.producto_id)}
                                                            className="form-checkbox h-4 w-4 text-orange-600 rounded"
                                                            disabled={isMassTransferring || isTransferring}
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {item.producto_nombre}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className="text-xs text-gray-700">{item.categoria_nombre}</span>
                                                </td>
                                                {/* CELDA CORREGIDA: Muestra Peso Total */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-700">
                                                    {formatKilos((Number(item.kilos) || 0) * (Number(item.stock_en_deposito) || 0))}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-orange-600">
                                                    {item.stock_en_deposito}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                                    {item.stock_en_tienda}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-center space-y-1">
                                                    <button
                                                        onClick={() => handleOpenModal(item)}
                                                        className="btn-primary flex items-center justify-center mx-auto text-sm py-1 px-3"
                                                        disabled={isMassTransferring || isTransferring}
                                                    >
                                                        <ArrowRight className="h-4 w-4 mr-1" /> Trasladar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* LISTA DE TARJETAS (Mobile) */}
                                <div className="md:hidden space-y-3">
                                    {/* Selector masivo para mobile, si hay stock visible */}
                                    {totalFilteredItemsWithStock > 0 && (
                                        <div className="flex items-center space-x-2 pb-2 border-b">
                                            <input
                                                type="checkbox"
                                                checked={totalFilteredItemsWithStock > 0 && allFilteredItemsWithStockSelected}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                className="form-checkbox h-4 w-4 text-orange-600 rounded"
                                            />
                                            <span className="text-sm font-semibold text-gray-700">Seleccionar todos los {totalFilteredItemsWithStock} ítems visibles con stock</span>
                                        </div>
                                    )}

                                    {filteredStock.map((item) => (
                                        <div key={item.producto_id} className="p-3 border rounded-lg shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center space-x-2">
                                                    {Number(item.stock_en_deposito) > 0 && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItems.has(item.producto_id)}
                                                            onChange={() => handleSelectItem(item.producto_id)}
                                                            className="form-checkbox h-4 w-4 text-orange-600 rounded"
                                                            disabled={isMassTransferring || isTransferring}
                                                        />
                                                    )}
                                                    <span className="text-sm font-bold text-gray-900">{item.producto_nombre}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs py-1 px-3 rounded-lg flex items-center"
                                                    disabled={isMassTransferring || isTransferring}
                                                >
                                                    <ArrowRight className="h-3 w-3 mr-1" /> Trasladar
                                                </button>
                                            </div>
                                            <div className="text-xs text-gray-600 mb-2 pl-6">
                                                Categoria.: {item.categoria_nombre}
                                            </div>
                                            <div className="flex justify-between text-sm pl-6">
                                                <span className="text-gray-500">Peso Total (Kg):</span>
                                                <span className="text-gray-600">
                                                    {formatKilos((Number(item.kilos) || 0) * (Number(item.stock_en_deposito) || 0))}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm pl-6">
                                                <span className="text-gray-500">Depósito:</span>
                                                <span className="font-semibold text-orange-600">{item.stock_en_deposito}</span>
                                            </div>
                                            <div className="flex justify-between text-sm pl-6">
                                                <span className="text-gray-500">Tienda:</span>
                                                <span className="text-gray-600">{item.stock_en_tienda}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* 💡 CONTENIDO DE LA PESTAÑA DE REPORTES */}
                {vistaActual === 'reporte' && (
                    <ReportesTraslado
                        reporteList={reporteList}
                        loadingReporte={loadingReporte}
                    />
                )}
            </div>

            {/* Modal de Traslado y Detalle de Lotes */}
            {showModal && selectedProduct && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
                    <div className="relative top-4 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-xl bg-white">
                        <div className="flex justify-between items-start border-b pb-3 mb-4">
                            <h3 className="text-xl font-bold text-gray-900">
                                Traslado: {selectedProduct.producto_nombre}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Columna 1: Formulario de Transferencia */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <ArrowRight className="h-5 w-5 mr-2 text-orange-500"/> Registrar Salida a Tienda
                                </h4>
                                <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium">Stock en Depósito: <span className="text-orange-600 font-bold">{selectedProduct.stock_en_deposito}</span></p>
                                    <p className="text-sm">Stock en Tienda: {selectedProduct.stock_en_tienda}</p>
                                    {/* MOSTRAR PESO DEL PRODUCTO */}
                                    {Number(selectedProduct.kilos) > 0 && (
                                        <p className="text-xs text-gray-600">Peso por unidad: <span className="font-semibold">{formatKilos(selectedProduct.kilos)} kg</span></p>
                                    )}
                                </div>

                                <form onSubmit={handleTransfer} className="space-y-4">
                                    {/* Selector de Modalidad */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <input
                                                type="radio"
                                                name="modo"
                                                value="trasladar"
                                                checked={modoTransferencia === 'trasladar'}
                                                onChange={() => { setModoTransferencia('trasladar'); setCantidadInput(''); }}
                                                className="form-radio h-4 w-4 text-orange-600"
                                            />
                                            <span className="ml-2">Cantidad a Trasladar</span>
                                        </label>
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <input
                                                type="radio"
                                                name="modo"
                                                value="quedar"
                                                checked={modoTransferencia === 'quedar'}
                                                onChange={() => { setModoTransferencia('quedar'); setCantidadInput(''); }}
                                                className="form-radio h-4 w-4 text-orange-600"
                                            />
                                            <span className="ml-2">Cantidad que Queda</span>
                                        </label>
                                    </div>

                                    {/* Input Dinámico */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            {modoTransferencia === 'trasladar'
                                                ? 'Cantidad que cargaste en la camioneta:'
                                                : 'Cantidad de unidades que deben quedar en el depósito:'}
                                        </label>
                                        <input
                                            type="number"
                                            step="1"
                                            min={modoTransferencia === 'quedar' ? "0" : "1"}
                                            max={selectedProduct.stock_en_deposito}
                                            required
                                            value={cantidadInput}
                                            onChange={e => {
                                                const value = parseInt(e.target.value);
                                                setCantidadInput(isNaN(value) ? e.target.value : value);
                                            }}
                                            className={inputFieldClass}
                                            disabled={isTransferring}
                                        />
                                    </div>

                                    {/* Resumen del Traslado (Cálculo Inverso y Peso Estimado) */}
                                    {(Number(cantidadInput) > 0 || (modoTransferencia === 'quedar' && Number(selectedProduct.stock_en_deposito) > 0)) && (
                                        <div className="text-sm p-2 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">

                                            {/* Cálculo de unidades a mover */}
                                            {modoTransferencia === 'quedar' ? (
                                                Number(cantidadInput) === 0 ? (
                                                    <p>Se trasladarán: <span className="font-bold">{selectedProduct.stock_en_deposito}</span> unidades. **Stock en depósito quedará en 0.**</p>
                                                ) : (
                                                    <p>Se trasladarán: <span className="font-bold">{Number(selectedProduct.stock_en_deposito) - Number(cantidadInput)}</span> unidades a la tienda.</p>
                                                )
                                            ) : (
                                                <p>Quedarán en depósito: <span className="font-bold">{Number(selectedProduct.stock_en_deposito) - Number(cantidadInput)}</span> unidades.</p>
                                            )}

                                            {/* CÁLCULO DE PESO ESTIMADO DEL TRASLADO */}
                                            {Number(selectedProduct.kilos) > 0 && (
                                                <p className="mt-1">
                                                    Peso estimado a mover: <span className="font-bold">
                                                        {formatNumber(
                                                            (modoTransferencia === 'trasladar' ? Number(cantidadInput) : (Number(selectedProduct.stock_en_deposito) - Number(cantidadInput)))
                                                            * Number(selectedProduct.kilos)
                                                        )} kg
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            className="btn-primary w-full sm:w-auto flex items-center justify-center px-6 py-2"
                                            disabled={isTransferring || Number(selectedProduct.stock_en_deposito) === 0 || cantidadInput === '' || (modoTransferencia === 'quedar' && Number(cantidadInput) === Number(selectedProduct.stock_en_deposito))}
                                        >
                                            {isTransferring ? (
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            ) : (
                                                <ArrowRight className="h-5 w-5 mr-2" />
                                            )}
                                            {isTransferring ? 'Trasladando...' : (modoTransferencia === 'quedar' && Number(cantidadInput) === 0) ? 'Confirmar Traslado Total (Stock 0)' : 'Confirmar Traslado'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Columna 2: Detalle de Lotes (FIFO) */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <Package className="h-5 w-5 mr-2 text-gray-500"/> Lotes en Depósito (FIFO)
                                </h4>
                                <div className="h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                                    {lotes.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">No se encontraron lotes activos para este producto.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {lotes.map(lote => (
                                                <div key={lote.id} className="flex justify-between items-center p-2 bg-white rounded shadow-sm border-l-4 border-gray-200">
                                                    <div className="text-sm">
                                                        <span className="font-bold text-gray-900">{lote.cantidad_actual}</span> unidades
                                                    </div>
                                                    <div className="flex items-center text-xs text-gray-600">
                                                        <Calendar className="h-3 w-3 mr-1" />
                                                        {formatDate(lote.fecha_ingreso)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">La transferencia siempre consume los lotes más antiguos primero (FIFO).</p>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default StockDeposito;