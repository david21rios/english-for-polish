// components/InteractiveExercises/OrderExercise.jsx
import React from 'react';
import { FaTrash, FaPlus, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const OrderExercise = ({ ejercicio, onChange }) => {
  const handleChange = (field, value) => {
    onChange({
      ...ejercicio,
      [field]: value
    });
  };

  const handleAddElemento = () => {
    const newElementos = [...(ejercicio.elementos || []), ''];
    onChange({
      ...ejercicio,
      elementos: newElementos,
      orden_correcto: [...newElementos.keys()]
    });
  };

  const handleElementoChange = (index, value) => {
    const newElementos = [...ejercicio.elementos];
    newElementos[index] = value;
    onChange({
      ...ejercicio,
      elementos: newElementos
    });
  };

  const handleRemoveElemento = (index) => {
    const newElementos = ejercicio.elementos.filter((_, i) => i !== index);
    const newOrden = ejercicio.orden_correcto
      .filter(pos => pos < ejercicio.elementos.length - 1)
      .map(pos => pos > index ? pos - 1 : pos);

    onChange({
      ...ejercicio,
      elementos: newElementos,
      orden_correcto: newOrden
    });
  };

  const handleMoveOrden = (index, direction) => {
    const newOrden = [...ejercicio.orden_correcto];
    const currentPos = newOrden.indexOf(index);
    const newPos = direction === 'up' ? currentPos - 1 : currentPos + 1;

    if (newPos >= 0 && newPos < newOrden.length) {
      [newOrden[currentPos], newOrden[newPos]] = [newOrden[newPos], newOrden[currentPos]];
      onChange({
        ...ejercicio,
        orden_correcto: newOrden
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Instrucciones
        </label>
        <textarea
          value={ejercicio.instrucciones || ''}
          onChange={(e) => handleChange('instrucciones', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          rows={2}
          placeholder="Instrucciones para ordenar los elementos..."
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">
            Elementos a ordenar
          </label>
          <button
            type="button"
            onClick={handleAddElemento}
            className="text-primary-600 hover:text-primary-700"
          >
            <FaPlus className="inline mr-2" /> Añadir elemento
          </button>
        </div>

        {(ejercicio.elementos || []).map((elemento, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={elemento}
              onChange={(e) => handleElementoChange(index, e.target.value)}
              className="flex-1 rounded-md border-gray-300"
              placeholder={`Elemento ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => handleRemoveElemento(index)}
              className="text-red-600"
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Orden correcto
        </label>
        <div className="space-y-2 border rounded-md p-4 bg-gray-50">
          {ejercicio.orden_correcto?.map((elementoIndex, ordenIndex) => (
            <div key={ordenIndex} className="flex items-center gap-2 bg-white p-2 rounded shadow-sm">
              <span className="text-gray-500 w-6 text-center">{ordenIndex + 1}.</span>
              <span className="flex-1">{ejercicio.elementos[elementoIndex]}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveOrden(elementoIndex, 'up')}
                  disabled={ordenIndex === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <FaArrowUp />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveOrden(elementoIndex, 'down')}
                  disabled={ordenIndex === ejercicio.orden_correcto.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <FaArrowDown />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderExercise;