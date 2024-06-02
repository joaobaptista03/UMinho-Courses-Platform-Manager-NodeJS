if [ -z "$1" ]; then
    echo "Usage: $0 <folder>"
    exit 1
fi

db_name="$1"

for file in $db_name/*.json; do
    collection_name="${file##*/}"
    collection_name="${collection_name%.*}"
    echo "Importing $collection_name..."
    mongoimport -d $db_name --collection $collection_name --file $file

cp -r $db_name/public html-geradorUCs/

done