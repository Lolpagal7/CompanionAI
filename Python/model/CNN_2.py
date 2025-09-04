import os
import json

# ----------- CNN MODEL ----------- #
class EmotionCNN:
    def __init__(self, num_classes):
        import torch
        import torch.nn as nn
        import torch.nn.functional as F
        self.torch = torch
        self.F = F
        class _Net(nn.Module):
            def __init__(self, num_classes):
                super(_Net, self).__init__()
                self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
                self.bn1 = nn.BatchNorm2d(32)
                self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
                self.bn2 = nn.BatchNorm2d(64)
                self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
                self.bn3 = nn.BatchNorm2d(128)
                self.pool = nn.MaxPool2d(2, 2)
                self.dropout = nn.Dropout(0.25)
                self.fc1 = nn.Linear(128 * 6 * 6, 512)
                self.fc2 = nn.Linear(512, num_classes)
            def forward(self, x):
                x = self.pool(self.F.relu(self.bn1(self.conv1(x))))
                x = self.pool(self.F.relu(self.bn2(self.conv2(x))))
                x = self.pool(self.F.relu(self.bn3(self.conv3(x))))
                x = x.view(-1, 128 * 6 * 6)
                x = self.dropout(self.F.relu(self.fc1(x)))
                x = self.fc2(x)
                return x
        self.model = _Net(num_classes)
    def to(self, device):
        self.model = self.model.to(device)
        return self
    def load_state_dict(self, state_dict):
        self.model.load_state_dict(state_dict)
    def eval(self):
        self.model.eval()
    def __call__(self, x):
        return self.model(x)

# ----------- TRAINING LOGIC ----------- #
def train_cnn2(dataset_path, num_classes=7, model_path=None):
    import torch
    from torch.utils.data import DataLoader
    from torchvision import datasets, transforms
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    transform = transforms.Compose([
        transforms.Resize((48, 48)),
        transforms.ToTensor()
    ])
    dataset = datasets.ImageFolder(root=dataset_path, transform=transform)
    class_names = dataset.classes
    train_size = int(0.9 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=64, num_workers=2)
    model = EmotionCNN(num_classes=len(class_names)).to(device)
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.model.parameters(), lr=0.0001)
    history = []
    best_val_acc = 0.0
    best_model_path = model_path or os.path.join(os.path.dirname(__file__), 'best_emotion_cnn_weights.pth')
    for epoch in range(4):
        model.model.train()
        total_loss = 0
        # Training loop
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        avg_loss = total_loss / len(train_loader)
        history.append(avg_loss)
        # Validation loop
        model.model.eval()
        correct = 0
        total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()
        val_acc = correct / total if total > 0 else 0
        print(f"Epoch [{epoch+1}/4], Loss: {avg_loss:.4f}, Val Acc: {val_acc:.4f}")
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({'model_state_dict': model.model.state_dict()}, best_model_path)
            print(f"[INFO] Best model updated and saved to {best_model_path}")
    print(f"Training complete. Best validation accuracy: {best_val_acc:.4f}")
    return True

# ----------- PREDICTION LOGIC ----------- #
def predict_with_cnn2(user_id, model_path=None):
    import torch
    from torchvision import transforms
    from PIL import Image
    import numpy as np
    try:
        print(f"[INFO] Running prediction for user_id: {user_id}")
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        class_names = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        if not model_path:
            model_path = os.path.join(os.path.dirname(__file__), 'best_emotion_cnn_weights.pth')
        if not os.path.exists(model_path):
            print("Warning: Trained CNN_2 model not found.")
            return None
        # Download image from Firebase Storage
        image_path = fetch_firebase_image(user_id)
        if not os.path.exists(image_path):
            print(f"Warning: Image for user_id {user_id} not found at {image_path}.")
            return None
        # Load model
        model = EmotionCNN(num_classes=len(class_names)).to(device)
        checkpoint = torch.load(model_path, map_location=device)
        model.load_state_dict(checkpoint['model_state_dict'])
        model.eval()
        # Preprocess image
        transform = transforms.Compose([
            transforms.Resize((48, 48)),
            transforms.ToTensor()
        ])
        image = Image.open(image_path).convert('RGB')
        image = transform(image)
        if image.dim() == 3:
            image = image.unsqueeze(0)
        image = image.float().to(device)
        # Predict
        with torch.no_grad():
            output = model(image)
            probs = torch.nn.functional.softmax(output, dim=1).cpu().numpy()[0]
        # Get top prediction
        top_idx = probs.argmax()
        label = class_names[top_idx]
        confidence = float(probs[top_idx])
        return {"label": label, "confidence": confidence}
    except Exception as e:
        print(f"[ERROR] predict_with_cnn2 error: {e}")
        return None

# ----------- FIREBASE PLACEHOLDER ----------- #
def fetch_firebase_image(user_id):
    """
    Placeholder for Firebase Storage download logic.
    Download the image for the given user_id and return the local file path.
    """
    # TODO: Implement using Firebase Admin SDK or pyrebase
    print(f"[Firebase] Downloading image for user_id: {user_id}")
    return f"/tmp/{user_id}_image.jpg"  # Example path

# ----------- MAIN BLOCK (for manual training) ----------- #
if __name__ == "__main__":
    # Example usage: train_cnn2('path/to/dataset')
    pass

_cnn2_model_cache = None

def load_cnn2_model(weights_path='best_emotion_cnn_weights.pth'):
    """
    Loads and caches the CNN_2 model. Only loads weights on first call.
    """
    global _cnn2_model_cache
    if _cnn2_model_cache is not None:
        return _cnn2_model_cache
    import torch
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    class_names = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
    model = EmotionCNN(num_classes=len(class_names)).to(device)
    checkpoint = torch.load(weights_path, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    _cnn2_model_cache = model
    return model

def predict_with_cnn2(image, weights_path='best_emotion_cnn_weights.pth'):
    """
    Predicts softmax probabilities for a given image using CNN_2.
    image: PIL.Image or np.ndarray (RGB)
    Returns: softmax probabilities (1D np.ndarray)
    """
    import torch
    from torchvision import transforms
    from PIL import Image
    import numpy as np
    model = load_cnn2_model(weights_path)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    transform = transforms.Compose([
        transforms.Resize((48, 48)),
        transforms.ToTensor()
    ])
    if isinstance(image, np.ndarray):
        image = Image.fromarray(image.astype('uint8')).convert('RGB')
    img_tensor = transform(image)
    if img_tensor.dim() == 3:
        img_tensor = img_tensor.unsqueeze(0)
    img_tensor = img_tensor.float().to(device)
    with torch.no_grad():
        output = model(img_tensor)
        probs = torch.softmax(output, dim=1).cpu().numpy()[0]
    return probs

def get_cnn_model(image, weights_path='best_emotion_cnn_weights.pth'):
    """
    Wrapper for backend_api.py: returns dict of class_name:prob for a given image (PIL or np.ndarray)
    """
    class_names = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
    probs = predict_with_cnn2(image, weights_path)
    return dict(zip(class_names, probs))