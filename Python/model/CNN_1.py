from linecache import cache
import numpy as np
from PIL import Image
import json
from torchvision import datasets, transforms
import os
import torch

# Dataset

# Function to load and preprocess a single image
def oneImg(file_path):
    img = Image.open(file_path,convert='RGB')
    img = img.resize((48, 48))
    data = np.array(img)
    data = data / 255.0  # Normalize to [0, 1]
    data= data.reshape(1, 48, 48, 3)  # Reshape to (1, 48, 48, 3)
    return data

# Function to load and preprocess a dataset of images (Training and Validation)
def load_imagefolder_numpy(dataset_path):
    transform = transforms.Compose([
        transforms.Resize((48, 48)),
        transforms.ToTensor()
    ])
    dataset = datasets.ImageFolder(root=dataset_path, transform=transform)
    N = len(dataset)
    X = np.zeros((N, 48, 48, 3), dtype=np.float32)
    Y = np.zeros((N,), dtype=np.int64)
    for i, (img_tensor, label) in enumerate(dataset):
        img_np = img_tensor.permute(1, 2, 0).numpy()  # (48, 48, 3)
        X[i] = img_np
        Y[i] = label
    return X, Y, dataset.classes

# Example usage:
# X, Y, class_names = load_imagefolder_numpy('path/to/dataset')

# oneHot function and batching logic remain unchanged
def oneHot(label, num_classes=7):
    one_hot = np.zeros(num_classes)
    one_hot[label] = 1
    return one_hot

# To get one-hot encoded labels:
# Y_onehot = np.array([oneHot(y, num_classes=len(class_names)) for y in Y])

def createBatches(X, Y, batch_size=64):

    m = X.shape[0]

    permutation = np.random.permutation(m)
    X_shuffled = X[permutation]
    Y_shuffled = Y[permutation]

    batches = []

    num_batches = m // batch_size
    for i in range(num_batches):
        start = i * batch_size
        end = start + batch_size
        X_batch = X_shuffled[start:end]
        Y_batch = Y_shuffled[start:end]
        batches.append((X_batch, Y_batch))

    if m % batch_size != 0:
        X_batch = X_shuffled[num_batches * batch_size:]
        Y_batch = Y_shuffled[num_batches * batch_size:]
        batches.append((X_batch, Y_batch))

    return batches


# CNN

# Forward Propagation Function
def forprop(X, W1, b1, W2, b2, W3, b3, W4, b4, W5, b5):

    def Relu(entry):
        return np.maximum(0, entry)
    
    def Softmax(entry):
        exp_sum = 0
        for i in (entry):
            i= np.exp(i)
            exp_sum += i
        return np.exp(entry) / exp_sum

    def Conv2D(X, W, b):
        h, w, c = X.shape
        kh, kw, kc = W.shape
        oh, ow = h - kh + 1, w - kw + 1
        output = np.zeros((oh, ow))

        for i in range(oh):
            for j in range(ow):
                output[i, j] = np.sum(X[i:i+kh, j:j+kw, :] * W) + b

        return output
    
    def MaxPooling(X, pool_size=2):
        h, w, c = X.shape
        ph, pw = pool_size, pool_size
        oh, ow = h // ph, w // pw
        output = np.zeros((oh, ow, c))
        indices = np.zeros((oh, ow, 2), dtype=int)

        for i in range(oh):
            for j in range(ow):
                window = X[i*ph:(i+1)*ph, j*pw:(j+1)*pw, :]
                output[i, j] = np.max( window, axis=(0, 1))
                for channel in range(c):
                    subwindow = window[:, :, channel] # shape (ph, pw)
                    max_idx = np.argmax(subwindow)
                    row, col = np.unravel_index(max_idx, (ph, pw))
                    indices[i, j, channel] = (row, col)

        return output, indices
    
    def Flatten(X):
        return X.reshape(X.shape[0], -1)
    

    
    # Forward Propagation
    Z1 = Conv2D(X, W1, b1)
    A1 = Relu(Z1)
    P1, indices1 = MaxPooling(A1, pool_size=2)
    Z2 = Conv2D(P1, W2, b2)
    A2 = Relu(Z2)
    P2, indices2 = MaxPooling(A2, pool_size=2)
    Z3 = Conv2D(P2, W3, b3)
    A3 = Relu(Z3)
    P3, indices3 = MaxPooling(A3, pool_size=2)
    a = Flatten(P3)
    Z4 = np.dot(a, W4) + b4 # Dense Layer 1
    A4 = Relu(Z4)
    Z5 = np.dot(A4, W5) + b5 # Dense Layer 2
    A5 = Softmax(Z5)

    # Loss Calculation
    Loss = -np.sum(Y * np.log(A5 + 1e-8))  # Adding epsilon to avoid log(0)

    return (Z1, A1, P1, indices1, Z2, A2, P2, indices2, Z3, A3, P3, indices3, a, Z4, A4, Z5, A5, Loss)


# Backpropagation Function
def backprop(X, Y, W1, b1, W2, b2, W3, b3, W4, b4, W5, b5, cache):
    def Relu_derivative(entry):
        return np.where(entry > 0, 1, 0)

    def Softmax_derivative(output, label):
        return output - label
    
    def Conv2D(X, W, b):
        h, w, c = X.shape
        kh, kw, kc = W.shape
        oh, ow = h - kh + 1, w - kw + 1
        output = np.zeros((oh, ow))

        for i in range(oh):
            for j in range(ow):
                output[i, j] = np.sum(X[i:i+kh, j:j+kw, :] * W) + b

        return output
    
    (Z1, A1, P1, indices1, Z2, A2, P2, indices2, Z3, A3, P3, indices3, a, Z4, A4, Z5, A5, Loss) = cache

    # Backward Propagation
    dZ5 = Softmax_derivative(A5, Y)
    dW5 = np.dot(A4.T, dZ5)
    db5 = np.sum(dZ5, axis=0)

    dA4 = np.dot(dZ5, W5.T)
    dZ4 = dA4 * Relu_derivative(Z4)
    dW4 = np.dot(a.T, dZ4)
    db4 = np.sum(dZ4, axis=0)

    da = np.dot(dZ4, W4.T)
    da = da.reshape(P3.shape)  # Reshape to match P3 shape
    dP3 = da * Relu_derivative(Z3)
    
    # Unpooling
    dP3_unpooled = np.zeros_like(P3)
    for i in range(dP3.shape[0]):
        for j in range(dP3.shape[1]):
            for channel in range(dP3.shape[2]):
                row_idx, col_idx = indices3[i, j, channel]
                dP3_unpooled[i*2 + row_idx, j*2 + col_idx, channel] = dP3[i, j]

    dZ3 = dP3_unpooled
    dW3 = Conv2D(P2.transpose(2, 0, 1), dZ3.transpose(1, 2, 0), b3).transpose(1, 2, 0)
    db3 = np.sum(dZ3.reshape(-1), axis=(0,1,2))

    dA2 = Conv2D(dZ3.transpose(1, 2, 0), W3.transpose(1, 0)).transpose(1, 2)
    dZ2 = dA2 * Relu_derivative(Z2)
    
    # Unpooling
    dP2 = np.zeros_like(P2)
    for i in range(dZ2.shape[0]):
        for j in range(dZ2.shape[1]):
            for channel in range(dZ2.shape[2]):
                row_idx, col_idx = indices2[i, j, channel]
                dP2[i*2 + row_idx, j*2 + col_idx, channel] = dZ2[i, j]
    dZ2 = dP2
    dW2 = Conv2D(P1.transpose(2, 0, 1), dZ2.transpose(1, 2, 0), b2).transpose(1, 2, 0)
    db2 = np.sum(dZ2.reshape(-1), axis=(0,1,2))
    dA1 = Conv2D(dZ2.transpose(1, 2, 0), W2.transpose(1, 0)).transpose(1, 2)
    dZ1 = dA1 * Relu_derivative(Z1)
    dW1 = Conv2D(X.transpose(2, 0, 1), dZ1.transpose(1, 2, 0), b1).transpose(1, 2, 0)
    db1 = np.sum(dZ1.reshape(-1), axis=(0,1,2))
    return (dW1, db1, dW2, db2, dW3, db3, dW4, db4, dW5, db5)


# Optimization Function
def optimization(W1, b1, W2, b2, W3, b3, W4, b4, W5, b5, dW1, db1, dW2, db2, dW3, db3, dW4, db4, dW5, db5, learning_rate=0.001):
    W1 -= learning_rate * dW1
    b1 -= learning_rate * db1
    W2 -= learning_rate * dW2
    b2 -= learning_rate * db2
    W3 -= learning_rate * dW3
    b3 -= learning_rate * db3
    W4 -= learning_rate * dW4
    b4 -= learning_rate * db4
    W5 -= learning_rate * dW5
    b5 -= learning_rate * db5
    return (W1, b1, W2, b2, W3, b3, W4, b4, W5, b5)


# Initialization of Weights and Biases (now using torch for checkpointing)
def save_weights_pt(path, W1, b1, W2, b2, W3, b3, W4, b4, W5, b5):
    weights = {
        'W1': W1, 'b1': b1,
        'W2': W2, 'b2': b2,
        'W3': W3, 'b3': b3,
        'W4': W4, 'b4': b4,
        'W5': W5, 'b5': b5
    }
    torch.save(weights, path)

def load_weights_pt(path):
    weights = torch.load(path, map_location='cpu')
    for k in weights:
        if isinstance(weights[k], torch.Tensor):
            weights[k] = weights[k].cpu().numpy()
    return (weights['W1'], weights['b1'], weights['W2'], weights['b2'],
            weights['W3'], weights['b3'], weights['W4'], weights['b4'],
            weights['W5'], weights['b5'])

def init_weights():
    W1 = np.random.randn(3, 3, 3, 16) * 0.01
    b1 = np.zeros((16,))
    W2 = np.random.randn(3, 3, 16, 32) * 0.01
    b2 = np.zeros((32,))
    W3 = np.random.randn(3, 3, 32, 64) * 0.01
    b3 = np.zeros((64,))
    W4 = np.random.randn(64 * 6 * 6, 128) * 0.01
    b4 = np.zeros((128,))
    W5 = np.random.randn(128, 7) * 0.01
    b5 = np.zeros((7,))
    return W1, b1, W2, b2, W3, b3, W4, b4, W5, b5

_cnn1_model_cache = None

def load_model(weights_path='cnn1_final_weights.pt'):
    global _cnn1_model_cache
    if _cnn1_model_cache is not None:
        return _cnn1_model_cache
    if not os.path.exists(weights_path):
        raise FileNotFoundError(f"Weights file not found: {weights_path}")
    W1, b1, W2, b2, W3, b3, W4, b4, W5, b5 = load_weights_pt(weights_path)
    _cnn1_model_cache = (W1, b1, W2, b2, W3, b3, W4, b4, W5, b5)
    return _cnn1_model_cache

def predict_with_cnn1(image_path, weights_path='cnn1_final_weights.pt'):
    """
    Predicts the class probabilities for a single image using saved weights.
    Returns softmax probabilities.
    """
    W1, b1, W2, b2, W3, b3, W4, b4, W5, b5 = load_model(weights_path)
    img = Image.open(image_path).convert('RGB')
    img = img.resize((48, 48))
    data = np.array(img) / 255.0
    data = data.reshape(1, 48, 48, 3)
    # Forward pass
    _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, A5, _ = forprop(data, W1, b1, W2, b2, W3, b3, W4, b4, W5, b5)
    return np.squeeze(A5)

# --- Lazy loading and prediction interface for backend_api.py and memory efficiency ---

_cnn1_weights_cache = None

def load_cnn1_model(weights_path='cnn1_final_weights.pt'):
    """
    Loads and caches the CNN_1 weights. Only loads weights on first call.
    """
    global _cnn1_weights_cache
    if _cnn1_weights_cache is not None:
        return _cnn1_weights_cache
    if not os.path.exists(weights_path):
        raise FileNotFoundError(f"Weights file not found: {weights_path}")
    W1, b1, W2, b2, W3, b3, W4, b4, W5, b5 = load_weights_pt(weights_path)
    _cnn1_weights_cache = (W1, b1, W2, b2, W3, b3, W4, b4, W5, b5)
    return _cnn1_weights_cache

def predict_with_cnn1(image, weights_path='cnn1_final_weights.pt'):
    """
    Predicts softmax probabilities for a single image (PIL.Image or np.ndarray or image path).
    Returns softmax probabilities (1D np.ndarray).
    """
    from PIL import Image
    import numpy as np
    import torch
    W1, b1, W2, b2, W3, b3, W4, b4, W5, b5 = load_cnn1_model(weights_path)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    if isinstance(image, str):
        img = Image.open(image).convert('RGB')
        img = img.resize((48, 48))
        data = np.array(img) / 255.0
        data = data.reshape(1, 48, 48, 3)
    elif isinstance(image, np.ndarray):
        if image.shape != (1, 48, 48, 3):
            img = Image.fromarray(image.astype('uint8')).convert('RGB')
            img = img.resize((48, 48))
            data = np.array(img) / 255.0
            data = data.reshape(1, 48, 48, 3)
        else:
            data = image
    else:
        # Assume PIL.Image
        img = image.resize((48, 48))
        data = np.array(img) / 255.0
        data = data.reshape(1, 48, 48, 3)
    # Ensure data is float and on device (for future compatibility)
    data = data.astype(np.float32)
    # Forward pass
    _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, A5, _ = forprop(data, W1, b1, W2, b2, W3, b3, W4, b4, W5, b5)
    return np.squeeze(A5)

# Remove or comment any placeholder lines like 'df = pd.read_csv()' if no CSV is provided.
# (No such lines present in this version)

# The following functions are exposed for import:
# - oneImg(file_path)
# - forprop()
# - backprop()
# - optimization()
# - evaluate()
# - train_cnn1(dataset_path, model_path=None)
# - predict_with_cnn1(user_id, model_path=None)
# All other code only runs if __name__ == "__main__"

if __name__ == "__main__":
    # Example usage:
    # train_cnn1('path/to/dataset')
    pass