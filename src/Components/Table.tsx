import { DataTable, type DataTableSelectionMultipleChangeEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { useEffect, useRef, useState } from "react";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { InputNumber, type InputNumberValueChangeEvent } from "primereact/inputnumber";

type Artwork = {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  date_start: number;
  date_end: number;
}

const Table = () => {
  const [currPage, setCurrPage] = useState<Artwork[]>([]);
  const [pageNo, setPageNo] = useState(1);
  const [first, setFirst] = useState(0);
  const [totalRecords,setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const overlay = useRef<OverlayPanel>(null);

  const [selectCount, setSelectCount] = useState<number | null>(null);
  const [explicitlyDeSelectedIds, setExplicitlyDeselectedIds] = 
  useState<Set<number>>(new Set());

  const getGlobalIndex = (localIndex: number): number => {
    return first + localIndex + 1;
  }

  const isRowSelected = (row: Artwork, localIndex: number): boolean => {
    if(explicitlyDeSelectedIds.has(row.id)) return false;

    if(selectCount !== null) {
      return getGlobalIndex(localIndex) <= selectCount;
    }

    return false;
  }

  const selectRows = currPage.filter((row, index) => 
    isRowSelected(row, index)
  );
  
  const onSelectionChange = (e: DataTableSelectionMultipleChangeEvent<Artwork[]>) => {
    const selectedIdsOnPage = new Set<number>(
    (e.value ?? []).map((row) => row.id)
    )

    const updatedDeselect = new Set(explicitlyDeSelectedIds);

    currPage.forEach((row, index) => {
      const globalIndex = getGlobalIndex(index);
      const isUnderRule = selectCount !== null && globalIndex <= selectCount;

      if(isUnderRule && !selectedIdsOnPage.has(row.id)) {
        updatedDeselect.add(row.id);
      }

      if(isUnderRule && selectedIdsOnPage.has(row.id)) {
        updatedDeselect.delete(row.id)
      }
    })

    setExplicitlyDeselectedIds(updatedDeselect);
  }

  const selectAcrossPages  = (n : number) => {
    setSelectCount(n);
    setExplicitlyDeselectedIds(new Set());
  }

  useEffect(() => {
    fetch(`https://api.artic.edu/api/v1/artworks?page=${pageNo}`)
      .then((res) => res.json())
      .then((d) => {
        // console.log(currPage);
        setCurrPage(d?.data);
        setTotalRecords(d?.pagination?.total);
      })
      .catch((err) => console.log(err))
      .finally(() => {
        setIsLoading(false);
      })
  }, [pageNo]);

  const titleHeader = (
    <div className="flex align-items-center gap-2">
      <Button
      icon="pi pi-chevron-down"
      className="p-button-text p-button-sm"
      onClick={(e) => overlay.current?.toggle(e)}
      />

      <OverlayPanel ref={overlay}>
        <div className="flex flex-column gap-2 p-2" style={{width: "250px"}}>
          <p>Select Multiple Rows</p>

          <span>
            Enter number of rows to select across all pages
          </span>

          <InputNumber
                       value={selectCount}
            onValueChange={(e: InputNumberValueChangeEvent) =>
              setSelectCount(e.value ?? null)
            }

          />

          <Button
            label="Select"
            size="small"
            disabled={selectCount === null}
            onClick={ () => {
              overlay.current?.hide()
              if(selectCount !== null){
                selectAcrossPages (selectCount)
              }
            }
          }
          />
        </div>
      </OverlayPanel>
    </div>
  )

  return (
    isLoading ? (
      <div>Loading...</div>
    ) : (
      <>
      <div>Table</div>
      <DataTable
        value={currPage}
        dataKey="id"
        paginator
        lazy
        first={first}
        rows={12}
        totalRecords={totalRecords}
        onPage={(e) => {
          setFirst(e.first);
          setPageNo(e.first / e.rows + 1);
        }}
        selectionMode="multiple"
        showGridlines
        selection={selectRows}
        onSelectionChange={onSelectionChange}
      >
        <Column selectionMode="multiple" header={titleHeader} headerStyle={{width: "3rem"}}/>
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="date_start" header="Start" />
        <Column field="date_end" header="End" />
      </DataTable>
    </>
    )
  );
};

export default Table;