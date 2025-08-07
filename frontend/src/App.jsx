import React, { useState, useEffect, useRef, useCallback } from 'react'; // Ajout de useCallback
import axios from 'axios';
import { CheckCircle, XCircle, Camera, VideoOff, Search, Calendar, User } from 'lucide-react';
import { createPortal } from 'react-dom';
import Quagga from 'quagga';

const API_BASE_URL = 'http://localhost:5000/api';

const Modal = ({ children }) => {
    return createPortal(
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-auto animate-fade-in-up">
                {children}
            </div>
        </div>,
        document.body
    );
};

const ValidationForm = ({ orderCode, onValidate, onCancel }) => {
    const [userName, setUserName] = useState('');
    const handleFormSubmit = (e) => {
        e.preventDefault();
        onValidate(userName);
    };

    return (
        <Modal>
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Validation de la Commande</h2>
            <p className="text-center text-gray-600 mb-6">
                Numéro de commande: <strong className="text-indigo-600">{orderCode}</strong>
            </p>
            <form onSubmit={handleFormSubmit}>
                <div className="mb-4">
                    <label htmlFor="signature" className="block text-gray-700 font-medium mb-2">
                        Signature (Nom complet):
                    </label>
                    <input
                        id="signature"
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Entrez votre nom complet"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200"
                    >
                        Valider
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const ValidatedOrders = () => {
    const [validations, setValidations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDateRange, setFilterDateRange] = useState('');
    const [filterOrderCode, setFilterOrderCode] = useState('');
    const [filterUserName, setFilterUserName] = useState('');

    // Utilisation de useCallback pour mémoriser fetchValidations
    const fetchValidations = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterDateRange) params.dateRange = filterDateRange;
            if (filterOrderCode) params.orderCode = filterOrderCode;
            if (filterUserName) params.userName = filterUserName;

            const response = await axios.get(`${API_BASE_URL}/validations`, { params });
            setValidations(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des validations:', error);
        } finally {
            setLoading(false);
        }
    }, [filterDateRange, filterOrderCode, filterUserName]); // Dépendances de useCallback

    useEffect(() => {
        fetchValidations();
    }, [fetchValidations]); // fetchValidations est maintenant une dépendance stable

    const handleFilterSearch = () => {
        fetchValidations(); // Re-exécuter la recherche avec les filtres actuels
    };

    if (loading) {
        return <p className="text-center text-gray-500">Chargement des validations...</p>;
    }

    return (
        <div className="p-4 bg-gray-100 rounded-lg shadow-inner">
            <h3 className="text-lg font-bold mb-4">Commandes validées</h3>
            <div className="mb-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <select
                        value={filterDateRange}
                        onChange={(e) => setFilterDateRange(e.target.value)}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Toutes les dates</option>
                        <option value="today">Aujourd'hui</option>
                        <option value="yesterday">Hier</option>
                        <option value="last_week">Dernière semaine</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Rechercher par code commande"
                        value={filterOrderCode}
                        onChange={(e) => setFilterOrderCode(e.target.value)}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom d'utilisateur"
                        value={filterUserName}
                        onChange={(e) => setFilterUserName(e.target.value)}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <button
                    onClick={handleFilterSearch}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-200"
                >
                    Appliquer les filtres
                </button>
            </div>

            {validations.length === 0 ? (
                <p className="text-center text-gray-500">Aucune commande validée ne correspond aux filtres.</p>
            ) : (
                <ul className="space-y-3 mt-4">
                    {validations.map((v, index) => (
                        <li key={index} className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
                            <p className="text-sm">
                                <strong className="text-indigo-600">Commande {v.numero_commande}</strong> validée par <strong className="text-gray-800">{v.nom_utilisateur}</strong> le {new Date(v.date_validation).toLocaleString('fr-FR')}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const App = () => {
    const [orderCode, setOrderCode] = useState('');
    const [products, setProducts] = useState([]);
    const [scannedProducts, setScannedProducts] = useState({});
    const [message, setMessage] = useState('');
    const [isValidationFormOpen, setIsValidationFormOpen] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const orderInputRef = useRef(null);
    const scanInputRef = useRef(null);
    const cameraRef = useRef(null);
    const [isQuaggaInitialized, setIsQuaggaInitialized] = useState(false);

    useEffect(() => {
        if (orderInputRef.current) {
            orderInputRef.current.focus();
        }
    }, []);

    const resetAppState = () => {
        setOrderCode('');
        setProducts([]);
        setScannedProducts({});
        setMessage('');
        setIsValidationFormOpen(false);
        setIsCameraActive(false);
        if (orderInputRef.current) orderInputRef.current.focus();
    };

    const handleSearch = async (code = orderCode) => {
        const trimmedCode = code.trim();
        if (!trimmedCode) {
            setMessage('Veuillez entrer un code de commande.');
            setProducts([]);
            setScannedProducts({});
            return;
        }
        setMessage('Recherche en cours...');
        try {
            const response = await axios.get(`${API_BASE_URL}/search/${trimmedCode}`);
            const fetchedProducts = response.data;
            setProducts(fetchedProducts);
            setScannedProducts({});
            setMessage('');
            if (fetchedProducts.length === 0) {
                setMessage('Aucun produit trouvé pour cette commande.');
            } else {
                setTimeout(() => scanInputRef.current?.focus(), 100);
            }
        } catch (error) {
            console.error('Erreur lors de la recherche :', error);
            setMessage(error.response?.data?.message || 'Erreur lors de la recherche de la commande.');
            setProducts([]);
            setScannedProducts({});
        }
    };

    const handleScan = (e) => {
        if (e.key !== 'Enter') return;
        if (!products.length) return;

        const scannedProductCode = e.target.value.trim();
        if (!scannedProductCode) {
            e.target.value = '';
            return;
        }

        const productExistsInOrder = products.some(p => p.produit === scannedProductCode);

        setScannedProducts(prev => {
            const newScannedProducts = { ...prev };
            newScannedProducts[scannedProductCode] = {
                matched: productExistsInOrder,
                scanned: true
            };
            return newScannedProducts;
        });

        if (!productExistsInOrder) {
            setMessage(`Ce produit (${scannedProductCode}) n'est pas pour cette commande !`);
        } else {
            setMessage('');
        }

        e.target.value = '';
        setTimeout(() => e.target.focus(), 0);
    };

    const startCameraScan = () => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => { // Capture le stream ici
                setIsCameraActive(true);
                setMessage('Scan par caméra activé...');

                // Assurez-vous que la balise video existe et est attachée
                if (cameraRef.current) {
                    const videoElement = document.createElement('video');
                    videoElement.style.width = '100%';
                    videoElement.style.height = '100%';
                    videoElement.style.objectFit = 'cover'; // Pour que la vidéo remplisse l'espace
                    videoElement.autoplay = true;
                    videoElement.muted = true; // Pour éviter le feedback audio
                    videoElement.playsInline = true; // Important pour iOS
                    cameraRef.current.innerHTML = ''; // Nettoyer le conteneur
                    cameraRef.current.appendChild(videoElement);
                    videoElement.srcObject = stream; // Attacher le stream à l'élément vidéo
                }


                const config = {
                    inputStream: {
                        name: "Live",
                        type: "LiveStream",
                        target: cameraRef.current, // Cible le div qui contient la vidéo
                        constraints: {
                            width: { min: 640 },
                            height: { min: 480 },
                            facingMode: "environment"
                        }
                    },
                    decoder: {
                        readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "upc_reader", "upc_e_reader"]
                    }
                };

                setTimeout(() => {
                    Quagga.init(config, (err) => {
                        if (err) {
                            console.error("Erreur d'initialisation de Quagga:", err);
                            setMessage("Erreur lors du démarrage de la caméra.");
                            setIsCameraActive(false);
                            return;
                        }
                        Quagga.start();
                        setIsQuaggaInitialized(true);
                    });

                    Quagga.onDetected((data) => {
                        const scannedCode = data.codeResult.code.trim();
                        if (scannedCode) {
                            Quagga.stop();
                            setIsCameraActive(false);
                            setIsQuaggaInitialized(false);
                            
                            if (!products.length) {
                                setOrderCode(scannedCode);
                                handleSearch(scannedCode);
                            } else {
                                const productExistsInOrder = products.some(p => p.produit === scannedCode);
                                setScannedProducts(prev => {
                                    const newScannedProducts = { ...prev };
                                    newScannedProducts[scannedCode] = {
                                        matched: productExistsInOrder,
                                        scanned: true
                                    };
                                    return newScannedProducts;
                                });
                                if (!productExistsInOrder) {
                                    setMessage(`Ce produit (${scannedCode}) n'est pas pour cette commande !`);
                                } else {
                                    setMessage('');
                                }
                            }
                        }
                    });
                }, 500);
            })
            .catch(err => {
                console.error("Erreur d'accès à la caméra:", err);
                setMessage("Veuillez autoriser l'accès à la caméra pour utiliser cette fonctionnalité.");
                setIsCameraActive(false);
            });
    };

    const stopCameraScan = () => {
        if (isQuaggaInitialized) {
            Quagga.stop();
            setIsQuaggaInitialized(false);
            const video = cameraRef.current.querySelector('video');
            if (video && video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            }
        }
        resetAppState();
    };

    useEffect(() => {
        if (products.length > 0) {
            const allProductsScannedAndMatched = products.every(p => scannedProducts[p.produit]?.scanned && scannedProducts[p.produit]?.matched);
            const totalScanned = Object.keys(scannedProducts).length;
            
            if (totalScanned > 0 && allProductsScannedAndMatched) {
                setMessage('Bravo! Vous avez matché tous les produits de cette commande.');
                setTimeout(() => setIsValidationFormOpen(true), 500);
            }
        }
    }, [scannedProducts, products]);

    const handleValidate = async (userName) => {
        setMessage('Validation en cours...');
        try {
            await axios.post(`${API_BASE_URL}/validate`, {
                numeroCommande: orderCode,
                nomUtilisateur: userName,
            });
            setMessage('Terminé !');
            setIsValidationFormOpen(false);
            setTimeout(() => {
                resetAppState();
            }, 2000);
        } catch (error) {
            console.error('Erreur lors de la validation :', error);
            setMessage(error.response?.data?.message || 'Erreur lors de la validation.');
            setIsValidationFormOpen(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen p-4 font-sans text-gray-800 gap-6">
            <div className="w-full md:w-2/3 bg-white shadow-xl rounded-2xl p-6 md:p-8">
                <header className="text-center mb-8">
                    <div className="flex justify-center items-center mb-4">
                        <img src="https://placehold.co/80x80/6366f1/ffffff?text=VALIDO" alt="Logo de l'application" className="rounded-full shadow-lg" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Gestionnaire de Commandes</h1>
                    <p className="mt-2 text-gray-500">Search & Scan, une solution rapide pour les pros de la production.</p>
                </header>

                <main>
                    {!isValidationFormOpen && (
                        <>
                            {isCameraActive ? (
                                <div className="flex flex-col md:flex-row gap-4 mb-8">
                                    <button
                                        onClick={stopCameraScan}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-colors duration-200 flex items-center justify-center w-full"
                                    >
                                        <VideoOff className="w-5 h-5 mr-2" />
                                        Arrêter le scan
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row gap-4 mb-8">
                                    <input
                                        type="text"
                                        placeholder="Entrez le code de la commande"
                                        value={orderCode}
                                        onChange={(e) => setOrderCode(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSearch();
                                        }}
                                        ref={orderInputRef}
                                        className="flex-grow px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        onClick={() => startCameraScan()}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-colors duration-200 flex items-center justify-center"
                                    >
                                        <Camera className="w-5 h-5 mr-2" />
                                        Scanner
                                    </button>
                                    <button
                                        onClick={() => handleSearch()}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-colors duration-200"
                                    >
                                        Rechercher
                                    </button>
                                </div>
                            )}

                            {isCameraActive && (
                                <div ref={cameraRef} id="camera-scanner" className="w-full h-64 bg-black rounded-lg mb-4 overflow-hidden"></div>
                            )}

                            {message && (
                                <p className="text-center font-medium text-gray-600 bg-gray-100 p-3 rounded-lg mb-4">{message}</p>
                            )}

                            {products.length > 0 && (
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Produits pour la commande {orderCode}:</h2>
                                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Scannez le code produit ici (ou entrez-le)"
                                            onKeyDown={handleScan}
                                            ref={scanInputRef}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button
                                            onClick={() => isCameraActive ? stopCameraScan() : startCameraScan()}
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-colors duration-200 flex items-center justify-center"
                                        >
                                            {isCameraActive ? <VideoOff className="w-5 h-5 mr-2" /> : <Camera className="w-5 h-5 mr-2" />}
                                            {isCameraActive ? 'Arrêter le scan' : 'Scanner'}
                                        </button>
                                    </div>

                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {products.map((product, index) => {
                                                const isScanned = scannedProducts[product.produit]?.scanned;
                                                const isCorrect = scannedProducts[product.produit]?.matched;
                                                const textClass = isScanned ? (isCorrect ? 'text-green-600' : 'text-red-600') : 'text-gray-800';
                                                
                                                return (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${textClass}`}>
                                                            {product.quantite ? `${product.quantite} x` : ''}
                                                        </td>
                                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${textClass}`}>
                                                            {product.produit}
                                                        </td>
                                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${textClass}`}>
                                                            {product.description}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            {isScanned && (
                                                                isCorrect ? (
                                                                    <CheckCircle className="text-green-500 w-6 h-6" />
                                                                ) : (
                                                                    <XCircle className="text-red-500 w-6 h-6" />
                                                                )
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
            <div className="w-full md:w-1/3 bg-white shadow-xl rounded-2xl p-6 md:p-8">
                <ValidatedOrders />
            </div>
            {isValidationFormOpen && (
                <ValidationForm
                    orderCode={orderCode}
                    onValidate={handleValidate}
                    onCancel={() => setIsValidationFormOpen(false)}
                />
            )}
        </div>
    );
};

export default App;
