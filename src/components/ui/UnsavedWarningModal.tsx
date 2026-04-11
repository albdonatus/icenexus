interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function UnsavedWarningModal({ onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Sair sem salvar?</h3>
        <p className="text-sm text-gray-500 mb-5">
          Você tem alterações não salvas. Se sair agora, todo o progresso será perdido.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Continuar editando
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
          >
            Sair sem salvar
          </button>
        </div>
      </div>
    </div>
  );
}
