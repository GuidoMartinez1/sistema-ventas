import { useEffect, useState, useMemo, useCallback } from 'react';
import { stockDepositoAPI, StockDeposito, LoteDeposito } from '../services/api';
import toast from 'react-hot-toast';
import { Package, Warehouse, Calendar, ArrowRight, X, Loader2, Maximize2 } from 'lucide-react';

// Clases de utilidad (tomadas de NuevaCompra.tsx para consistencia)
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out text-sm";
const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const StockDeposito = () => {
    const [stockList, setStockList] = useState<StockDeposito[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    // Estado para el modal de transferencia/detalle
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<StockDeposito | null>(null);
    const [lotes, setLotes] = useState<LoteDeposito[]>([]);
    const [isTransferring, setIsTransferring] = useState(false);
    const [isMassTransferring, setIsMassTransferring] = useState(false);

    // Estado para la transferencia en el modal
    const [cantidadInput, setCantidadInput] = useState<number | string>('');
    const [modoTransferencia, setModoTransferencia] = useState<'trasladar' | 'quedar'>('trasladar');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await stockDepositoAPI.getAll();
            // Asegurarse de que stock_en_deposito sea un número (puede venir como string o nulo)
            const safeStockList = response.data.map((item: StockDeposito) => ({
                ...item,
                stock_en_deposito: Number(item.stock_en_deposito) || 0,
            }));
            setStockList(safeStockList);
        } catch {
            toast.error('Error al cargar el stock del depósito.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredStock = useMemo(() => {
        return stockList.filter(item =>
            item.producto_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            item.codigo?.toLowerCase().includes(busqueda.toLowerCase())
        );
    }, [stockList, busqueda]);

    // CORRECCIÓN CLAVE: Calcula el stock total en depósito usando Number() para evitar concatenación o errores.
    const totalStockInDeposito = useMemo(() => {
        return stockList.reduce((sum, item) => sum + (Number(item.stock_en_deposito) || 0), 0);
    }, [stockList]);


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
                toast.success(`Traslado masivo completado: ${successCount} productos vaciados. ${failCount} errores.`);
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


    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;

        let cantidadAMover = 0;
        const stockActual = Number(selectedProduct.stock_en_deposito);
        const inputNum = Number(cantidadInput);

        // Validación de número y cálculo
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
        } else { // modoTransferencia === 'quedar'
            if (inputNum < 0) {
                return toast.error("La cantidad que queda no puede ser negativa.");
            }
            if (inputNum > stockActual) {
                return toast.error(`Error: No puedes dejar más stock del que tienes (${stockActual}).`);
            }
            // Esto permite 0 como opción válida (Stock actual - 0 = stock actual a mover)
            cantidadAMover = stockActual - inputNum;
        }

        // Final guard: Si la cantidad a mover es 0 (cuando inputNum == stockActual)
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">

            {/* ENCABEZADO Y BOTÓN MAESTRO DE TRASLADO */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Warehouse className="h-7 w-7 mr-2 text-orange-500" />
                        Stock en Depósito
                    </h1>
                    <p className="text-gray-600">Control de la mercadería almacenada y traslados a la tienda física.</p>
                </div>

                {/* Botón Maestro Trasladar Todo (Estilos Corregidos) */}
                <button
                    onClick={handleMassTransferAll}
                    // Aplicamos la clase del botón primario (naranja) o un color que se ajuste a tu sistema (púrpura o naranja)
                    // Usaré un púrpura más oscuro para diferenciarlo y mantener un color de sistema.
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-lg py-3 px-6 transition duration-150 ease-in-out font-semibold flex items-center shadow-lg hover:shadow-xl disabled:bg-gray-400"
                    disabled={isMassTransferring || totalStockInDeposito === 0}
                >
                    {isMassTransferring ? (
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    ) : (
                        <Maximize2 className="h-6 w-6 mr-2" />
                    )}
                    {/* Sumatoria Corregida */}
                    {isMassTransferring ? 'Vaciando Depósito...' : `Vaciar Depósito Completo (${totalStockInDeposito} uds.)`}
                </button>
            </div>

            <div className={cardClass}>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Buscar producto por nombre o código..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className={`${inputFieldClass} w-full md:w-1/3`}
                    />
                </div>

                {filteredStock.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        {busqueda ? 'No se encontraron productos con ese criterio en el depósito.' : 'No hay stock registrado actualmente en el depósito.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cód. / Cat.</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Depósito</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Tienda</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStock.map((item) => (
                                <tr key={item.producto_id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.producto_nombre}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.codigo} <br/>
                                        <span className="text-xs text-gray-400">{item.categoria_nombre}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-orange-600">
                                        {item.stock_en_deposito}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                        {item.stock_en_tienda}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-center space-y-1">
                                        {/* Botón Trasladar: Abre el modal para traslado individual */}
                                        <button
                                            onClick={() => handleOpenModal(item)}
                                            className="btn-primary flex items-center justify-center mx-auto text-sm py-1 px-3"
                                            disabled={isMassTransferring}
                                        >
                                            <ArrowRight className="h-4 w-4 mr-1" /> Trasladar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Traslado y Detalle de Lotes */}
            {showModal && selectedProduct && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-xl bg-white">
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
                                </div>

                                <form onSubmit={handleTransfer} className="space-y-4">
                                    {/* Selector de Modalidad */}
                                    <div className="flex items-center space-x-4">
                                        <label className="flex items-center text-sm font-medium text-gray-700">
                                            <input
                                                type="radio"
                                                name="modo"
                                                value="trasladar"
                                                checked={modoTransferencia === 'trasladar'}
                                                onChange={() => { setModoTransferencia('trasladar'); setCantidadInput(''); }}
                                                className="form-radio h-4 w-4 text-purple-600"
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
                                                className="form-radio h-4 w-4 text-purple-600"
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

                                    {/* Resumen del Traslado (Cálculo Inverso) */}
                                    {(Number(cantidadInput) > 0) || (modoTransferencia === 'quedar' && Number(cantidadInput) === 0 && Number(selectedProduct.stock_en_deposito) > 0) ? (
                                        <div className="text-sm p-2 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
                                            {modoTransferencia === 'quedar' ? (
                                                Number(cantidadInput) === 0 ? (
                                                    <p>Se trasladarán: <span className="font-bold">{selectedProduct.stock_en_deposito}</span> unidades. **Stock en depósito quedará en 0.**</p>
                                                ) : (
                                                    <p>Se trasladarán: <span className="font-bold">{Number(selectedProduct.stock_en_deposito) - Number(cantidadInput)}</span> unidades a la tienda.</p>
                                                )
                                            ) : (
                                                <p>Quedarán en depósito: <span className="font-bold">{Number(selectedProduct.stock_en_deposito) - Number(cantidadInput)}</span> unidades.</p>
                                            )}
                                        </div>
                                    ) : null}

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            className="btn-primary flex items-center justify-center px-6 py-2"
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