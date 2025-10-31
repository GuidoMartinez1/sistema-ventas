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

    // Estado para la transferencia
    const [cantidadInput, setCantidadInput] = useState<number | string>('');
    const [modoTransferencia, setModoTransferencia] = useState<'trasladar' | 'quedar'>('trasladar'); // Cantidad a Mover vs. Cantidad a Quedar
    const [trasladarTodo, setTrasladarTodo] = useState(false); // Marcar si se debe trasladar todo el stock (checkbox)

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await stockDepositoAPI.getAll();
            setStockList(response.data);
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

    const handleOpenModal = async (product: StockDeposito) => {
        setSelectedProduct(product);
        setShowModal(true);
        setCantidadInput(''); // Resetear input
        setTrasladarTodo(false); // Resetear estado de traslado total
        setModoTransferencia('trasladar'); // Poner modo por defecto
        try {
            const lotesResponse = await stockDepositoAPI.getLotes(product.producto_id);
            setLotes(lotesResponse.data);
        } catch {
            toast.error('Error al cargar el detalle de lotes.');
            setLotes([]);
        }
    };

    const handleTrasladarTodo = (checked: boolean) => {
        setTrasladarTodo(checked);
        if (checked && selectedProduct) {
            setModoTransferencia('trasladar');
            setCantidadInput(selectedProduct.stock_en_deposito); // Muestra la cantidad total
        } else {
            setCantidadInput('');
        }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;

        let cantidadAMover = 0;
        const stockActual = selectedProduct.stock_en_deposito;
        const inputNum = Number(cantidadInput);

        // 1. LÓGICA DE TRASLADO TOTAL (CHECKBOX)
        if (trasladarTodo) {
            cantidadAMover = stockActual;
        }
        // 2. LÓGICA MANUAL (incluye 'quedar' = 0)
        else {
            // Validación de número
            if (isNaN(inputNum)) {
                return toast.error("La cantidad ingresada no es válida.");
            }

            // Validación de cantidad mínima/negativa y cálculo
            if (modoTransferencia === 'trasladar') {
                if (inputNum <= 0) {
                    return toast.error("La cantidad a trasladar debe ser mayor a cero.");
                }
                if (inputNum > stockActual) {
                    return toast.error(`Error: Intentas trasladar más stock del que tienes en depósito (${stockActual}).`);
                }
                cantidadAMover = inputNum;
            }

            else { // modoTransferencia === 'quedar'
                if (inputNum < 0) {
                    return toast.error("La cantidad que queda no puede ser negativa.");
                }
                if (inputNum > stockActual) {
                    return toast.error(`Error: No puedes dejar más stock del que tienes (${stockActual}).`);
                }
                // Si inputNum es 0, cantidadAMover será stockActual. Esto es correcto.
                cantidadAMover = stockActual - inputNum;
            }
        }

        // Final guard: Si la cantidad a mover es 0, solo permitimos si el stock actual es 0 (lo cual deshabilitaría el botón, pero como guardia)
        if (cantidadAMover <= 0) {
            if (stockActual > 0) {
                // Caso: El usuario quiere mover 0 unidades (e.g. pone 10 en "Cantidad que Queda" y stock es 10)
                if (modoTransferencia === 'quedar' && inputNum === stockActual) {
                    return toast.error("El stock ya está en su cantidad final. No hay unidades para trasladar.");
                }
                return toast.error("La cantidad a mover debe ser mayor a cero.");
            } else {
                return toast.error("No hay stock para mover.");
            }
        }


        setIsTransferring(true);
        try {
            await stockDepositoAPI.transferir(selectedProduct.producto_id, cantidadAMover);

            // Refinamiento del mensaje: Si la cantidad movida es igual al stock inicial, es un 'Vacíado'
            const vacioDeDeposito = cantidadAMover === stockActual;

            if (vacioDeDeposito) {
                toast.success(`Todo el stock (${cantidadAMover} unidades) de ${selectedProduct.producto_nombre} fue trasladado. Stock en depósito: 0.`);
            } else {
                toast.success(`Traslado de ${cantidadAMover} unidades de ${selectedProduct.producto_nombre} a la tienda registrado.`);
            }

            // Refrescar datos
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
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <Warehouse className="h-7 w-7 mr-2 text-orange-500" />
                    Stock en Depósito
                </h1>
                <p className="text-gray-600">Control de la mercadería almacenada y traslados a la tienda física.</p>
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
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-center">
                                        <button
                                            onClick={() => handleOpenModal(item)}
                                            className="btn-primary flex items-center justify-center mx-auto text-sm py-1 px-3"
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
                                    {/* SECCIÓN: Trasladar Todo (Checkbox) */}
                                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                                        <label className="flex items-center text-sm font-medium text-purple-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={trasladarTodo}
                                                onChange={e => handleTrasladarTodo(e.target.checked)}
                                                className="form-checkbox h-5 w-5 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                                                disabled={selectedProduct.stock_en_deposito === 0}
                                            />
                                            <span className="ml-3 font-bold">VACÍO DE DEPÓSITO (Trasladar TODO: {selectedProduct.stock_en_deposito})</span>
                                        </label>
                                        <Maximize2 className={`h-5 w-5 ${trasladarTodo && selectedProduct.stock_en_deposito > 0 ? 'text-purple-600' : 'text-purple-400'}`} />
                                    </div>

                                    {/* Selector de Modalidad */}
                                    <div className="flex items-center space-x-4">
                                        <label className={`flex items-center text-sm font-medium ${trasladarTodo ? 'text-gray-400' : 'text-gray-700'}`}>
                                            <input
                                                type="radio"
                                                name="modo"
                                                value="trasladar"
                                                checked={modoTransferencia === 'trasladar'}
                                                onChange={() => setModoTransferencia('trasladar')}
                                                className="form-radio h-4 w-4 text-purple-600"
                                                disabled={trasladarTodo}
                                            />
                                            <span className="ml-2">Cantidad a Trasladar</span>
                                        </label>
                                        <label className={`flex items-center text-sm font-medium ${trasladarTodo ? 'text-gray-400' : 'text-gray-700'}`}>
                                            <input
                                                type="radio"
                                                name="modo"
                                                value="quedar"
                                                checked={modoTransferencia === 'quedar'}
                                                onChange={() => setModoTransferencia('quedar')}
                                                className="form-radio h-4 w-4 text-purple-600"
                                                disabled={trasladarTodo}
                                            />
                                            <span className="ml-2">Cantidad que Queda</span>
                                        </label>
                                    </div>

                                    {/* Input Dinámico */}
                                    <div>
                                        <label className={`block text-sm font-medium ${trasladarTodo ? 'text-gray-400' : 'text-gray-700'}`}>
                                            {modoTransferencia === 'trasladar'
                                                ? 'Cantidad que cargaste en la camioneta:'
                                                : 'Cantidad de unidades que deben quedar en el depósito:'}
                                        </label>
                                        <input
                                            type="number"
                                            step="1"
                                            // El min es 0 solo cuando el modo es 'quedar' y no se está trasladando todo
                                            min={modoTransferencia === 'quedar' && !trasladarTodo ? "0" : "1"}
                                            max={selectedProduct.stock_en_deposito}
                                            required={!trasladarTodo}
                                            value={trasladarTodo ? selectedProduct.stock_en_deposito : cantidadInput}
                                            onChange={e => {
                                                const value = parseInt(e.target.value);
                                                setCantidadInput(value < 0 ? 0 : value || '');
                                            }}
                                            className={inputFieldClass}
                                            disabled={isTransferring || trasladarTodo}
                                        />
                                    </div>

                                    {/* Resumen del Traslado (Cálculo Inverso) */}
                                    {(!trasladarTodo && Number(cantidadInput) > 0) || (trasladarTodo && selectedProduct.stock_en_deposito > 0) || (modoTransferencia === 'quedar' && Number(cantidadInput) === 0 && selectedProduct.stock_en_deposito > 0) ? (
                                        <div className="text-sm p-2 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
                                            {trasladarTodo || (modoTransferencia === 'quedar' && Number(cantidadInput) === 0) ? (
                                                <p>Se trasladarán: <span className="font-bold">{selectedProduct.stock_en_deposito}</span> unidades. **Stock en depósito quedará en 0.**</p>
                                            ) : modoTransferencia === 'quedar' ? (
                                                <p>Se trasladarán: <span className="font-bold">{selectedProduct.stock_en_deposito - Number(cantidadInput)}</span> unidades a la tienda.</p>
                                            ) : (
                                                <p>Quedarán en depósito: <span className="font-bold">{selectedProduct.stock_en_deposito - Number(cantidadInput)}</span> unidades.</p>
                                            )}
                                        </div>
                                    ) : null}

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            className="btn-primary flex items-center justify-center px-6 py-2"
                                            // Habilitado si hay stock y:
                                            // a) El checkbox está marcado (trasladarTodo)
                                            // b) O si la cantidad input es válida para el modo actual (e.g. > 0 para trasladar, >= 0 para quedar)
                                            disabled={isTransferring || selectedProduct.stock_en_deposito === 0 || (!trasladarTodo && (isNaN(Number(cantidadInput)) || (modoTransferencia === 'trasladar' && Number(cantidadInput) <= 0) || (modoTransferencia === 'quedar' && Number(cantidadInput) === selectedProduct.stock_en_deposito)))}
                                        >
                                            {isTransferring ? (
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            ) : (
                                                <ArrowRight className="h-5 w-5 mr-2" />
                                            )}
                                            {isTransferring ? 'Trasladando...' : (trasladarTodo || (modoTransferencia === 'quedar' && Number(cantidadInput) === 0)) ? 'Confirmar Traslado Total (Stock 0)' : 'Confirmar Traslado'}
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