#!/bin/bash

# Taille de fichier maximale (en octets)
maxsize=20144

# Parcourir tous les fichiers png dans le répertoire courant
for img in *.png
do
    # Obtenir la taille de fichier actuelle
    filesize=$(stat -f%z "$img")
    # Tant que la taille de fichier est supérieure à la taille maximale
    while [ $filesize -gt $maxsize ]
    do
        # Réduire la taille de l'image de 10%
        mogrify -resize 90% "$img"
        # Recalculer la taille de fichier
        filesize=$(stat -f%z "$img")
    done
done