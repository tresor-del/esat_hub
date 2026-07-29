

export const rebuildName = (name) => {
    const isMobile = window.innerWidth < 768
    switch (name) {
        case "PREPA_1":
           return !isMobile ? "Cycle Prépa. Première Année" : "Cycle Prepa. 1ere Année" 
             
        case "PREPA_2":
            return !isMobile ? "Cycle Prépa. Deuxième Année" : "Cycle Prepa. 2ere Année" 
        case "INGE_1":
            return !isMobile ? "Cycle ingénieur Première Année" : "Cycle Ingé. 1eme Année"
        case "INGE_2":
            return !isMobile ? "Cycle Ingénieur Deuxieme Année": "Cycle Ingé. 2eme Année"
        case "INGE_3":
            return !isMobile ? "Cycle Ingénieur Troisieme Année" : "Cycle Ingé. 3eme Année"
    }
}

export const downloadFile = async (e, file_path, file_name) => {
    e.preventDefault();

    try {
        const response = await fetch(file_path);
        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file_name

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Erreur lors du téléchargement :", error);
        // Solution de secours : ouvre le fichier dans un onglet si le fetch échoue
        window.open(filePath, '_blank', 'noopener,noreferrer');
    }
}